'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { crearNotificacion } from './notifications'
import { enviarPushNotification } from './push'

export async function postularse(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tenés que estar logueado.', ok: false }

  const postId  = formData.get('post_id') as string
  const message = (formData.get('message') as string).trim() || null

  const { data: post } = await supabase
    .from('posts').select('user_id, type, title').eq('id', postId).single()

  if (!post)                     return { error: 'La publicación no existe.', ok: false }
  if (post.user_id === user.id) {
    const errMsg = post.type === 'oferta'
      ? 'No podés solicitar tu propio servicio.'
      : 'No podés enviar una solicitud a tu propia publicación.'
    return { error: errMsg, ok: false }
  }

  const { error } = await supabase.from('applications').insert({
    post_id:      postId,
    applicant_id: user.id,
    message,
    status:       'pendiente',
  })

  if (error?.code === '23505') {
    const errMsg = post.type === 'oferta'
      ? 'Ya enviaste una solicitud para esta publicación.'
      : 'Ya enviaste una solicitud para esta publicación.'
    return { error: errMsg, ok: false }
  }
  if (error) return { error: 'No se pudo enviar. Intentá de nuevo.', ok: false }

  const { data: applicantUser } = await supabase
    .from('users').select('first_name, username').eq('id', user.id).single()
  const nombre = applicantUser?.first_name || applicantUser?.username || 'Alguien'

  const trunc = (s: string, n = 100) => s.length > n ? s.slice(0, n) + '...' : s

  const pushBodyPostulacion = message
    ? trunc(`En "${post.title}" — ${message}`)
    : trunc(`En "${post.title}"`)

  await Promise.all([
    crearNotificacion({
      userId:  post.user_id,
      type:    'nueva_postulacion',
      message: `${nombre} quiere contactarte por "${post.title}"`,
      link:    `/post/${postId}`,
    }),
    // Sin aviso "Enviaste tu solicitud" para quien la envía: lo acaba de hacer él mismo
    // (la confirmación la ve en el formulario). Las viejas de la base se siguen mostrando.
    enviarPushNotification(post.user_id, {
      title: `${nombre} quiere contactarte`,
      body:  pushBodyPostulacion,
      url:   `/post/${postId}?from=notification`,
    }),
  ])

  revalidatePath(`/post/${postId}`)
  revalidatePath('/notificaciones')
  return { error: null, ok: true }
}

export async function aceptarPostulacion(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const applicationId = formData.get('application_id') as string
  const postId        = formData.get('post_id')        as string

  const [, { data: app }] = await Promise.all([
    // La RLS solo permite update si sos el dueño del post
    supabase.from('applications').update({ status: 'aceptado' }).eq('id', applicationId),
    supabase.from('applications').select('applicant_id').eq('id', applicationId).single(),
  ])

  const [{ data: post }, { data: authorUser }] = await Promise.all([
    supabase.from('posts').select('title, type').eq('id', postId).single(),
    supabase.from('users').select('first_name, username').eq('id', user.id).single(),
  ])

  if (app && post) {
    const authorNombre = authorUser?.first_name || authorUser?.username || 'Alguien'
    const trunc = (s: string, n = 100) => s.length > n ? s.slice(0, n) + '...' : s

    const notifMsg = `${authorNombre} quiere trabajar con vos en "${post.title}"`

    await Promise.all([
      crearNotificacion({
        userId:  app.applicant_id,
        type:    'postulacion_aceptada',
        message: notifMsg,
        link:    `/post/${postId}`,
      }),
      enviarPushNotification(app.applicant_id, {
        title: `${authorNombre} quiere trabajar con vos`,
        body:  trunc(`En "${post.title}" — Ahora podés coordinar los detalles`),
        url:   `/post/${postId}?from=notification`,
      }),
    ])
  }

  revalidatePath(`/post/${postId}`)
}

export async function rechazarPostulacion(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const applicationId = formData.get('application_id') as string
  const postId        = formData.get('post_id')        as string

  // La RLS solo permite update si sos el dueño del post.
  // A propósito NO se notifica al interesado (ni push ni notificación interna): avisar un
  // rechazo no le sirve y desanima. Ve el estado "Rechazada" en Mi actividad si entra a mirar.
  await supabase.from('applications').update({ status: 'rechazado' }).eq('id', applicationId)

  revalidatePath(`/post/${postId}`)
}
