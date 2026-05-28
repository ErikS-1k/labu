'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { crearNotificacion } from './notifications'

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
      : 'No podés postularte a tu propia publicación.'
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
      : 'Ya te postulaste para esta publicación.'
    return { error: errMsg, ok: false }
  }
  if (error) return { error: 'No se pudo enviar. Intentá de nuevo.', ok: false }

  const esOferta = post.type === 'oferta'
  await Promise.all([
    crearNotificacion({
      userId:  post.user_id,
      type:    'nueva_postulacion',
      message: esOferta
        ? `Tenés una nueva solicitud de contacto para "${post.title}"`
        : `Tenés una nueva postulación en "${post.title}"`,
      link:    `/post/${postId}`,
    }),
    crearNotificacion({
      userId:  user.id,
      type:    'postulacion_enviada',
      message: esOferta
        ? `Tu solicitud para "${post.title}" fue enviada. Te avisamos cuando el oferente responda.`
        : `Tu postulación a "${post.title}" fue enviada. Te avisamos cuando el empleador responda.`,
      link:    `/post/${postId}`,
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

  const { data: post } = await supabase.from('posts').select('title, type').eq('id', postId).single()

  if (app && post) {
    await crearNotificacion({
      userId:  app.applicant_id,
      type:    'postulacion_aceptada',
      message: post.type === 'oferta'
        ? `Tu solicitud para "${post.title}" fue aceptada`
        : `Tu postulación a "${post.title}" fue aceptada`,
      link:    `/post/${postId}`,
    })
  }

  revalidatePath(`/post/${postId}`)
}

export async function rechazarPostulacion(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const applicationId = formData.get('application_id') as string
  const postId        = formData.get('post_id')        as string

  const [, { data: app }] = await Promise.all([
    supabase.from('applications').update({ status: 'rechazado' }).eq('id', applicationId),
    supabase.from('applications').select('applicant_id').eq('id', applicationId).single(),
  ])

  const { data: post } = await supabase.from('posts').select('title, type').eq('id', postId).single()

  if (app && post) {
    await crearNotificacion({
      userId:  app.applicant_id,
      type:    'postulacion_rechazada',
      message: post.type === 'oferta'
        ? `Tu solicitud para "${post.title}" fue rechazada`
        : `Tu postulación a "${post.title}" fue rechazada`,
      link:    `/post/${postId}`,
    })
  }

  revalidatePath(`/post/${postId}`)
}
