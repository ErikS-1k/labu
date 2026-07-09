'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { crearNotificacion } from './notifications'

export async function publicarPost(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Tenés que estar logueado para publicar.' }

  const type = formData.get('type') as string
  const priceRaw = formData.get('price') as string
  // getAll recoge todos los valores del mismo nombre — necesario para checkboxes múltiples
  const modality = formData.getAll('modality') as string[]

  if (modality.length === 0) return { error: 'Seleccioná al menos una duración.' }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id:    user.id,
      type,
      title:      formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      category:   (formData.get('category') as string) || null,
      modality,
      price:             priceRaw ? parseFloat(priceRaw) : null,
      price_type:        priceRaw ? ((formData.get('price_type') as string) || null) : 'a_convenir',
      location:          (formData.get('location') as string) || null,
      presencialidad:    (formData.get('presencialidad') as string) || null,
      temporal_duration: (formData.get('temporal_duration') as string) || null,
    })
    .select('id')
    .single()

  if (error) return { error: 'No se pudo publicar. Intentá de nuevo.' }

  revalidatePath(type === 'oferta' ? '/ofertas' : '/requerimientos')
  redirect(`/publicar?exito=1&tipo=${type}`)
}

export async function eliminarPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const postId    = formData.get('post_id')    as string
  const type      = formData.get('type')        as string
  const returnTo  = formData.get('return_to')   as string | null

  await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id)

  if (returnTo) {
    revalidatePath(returnTo)
    return
  }
  redirect('/mi-actividad?toast=publicacion_eliminada')
}

export async function editarPost(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tenés que estar logueado.' }

  const postId   = formData.get('post_id') as string
  const priceRaw = formData.get('price') as string
  const modality = formData.getAll('modality') as string[]

  if (modality.length === 0) return { error: 'Seleccioná al menos una duración.' }

  // .eq('user_id', user.id) garantiza que solo el dueño puede editar
  const { error } = await supabase
    .from('posts')
    .update({
      type:        formData.get('type') as string,
      title:       formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      category:    (formData.get('category') as string) || null,
      modality,
      price:             priceRaw ? parseFloat(priceRaw) : null,
      price_type:        (formData.get('price_type') as string) || null,
      location:          (formData.get('location') as string) || null,
      presencialidad:    (formData.get('presencialidad') as string) || null,
      temporal_duration: (formData.get('temporal_duration') as string) || null,
    })
    .eq('id', postId)
    .eq('user_id', user.id)

  if (error) return { error: 'No se pudo guardar. Intentá de nuevo.' }

  redirect('/mi-actividad?toast=publicacion_editada')
}

export async function cerrarPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const postId = formData.get('post_id') as string
  await supabase.from('posts').update({ is_active: false }).eq('id', postId).eq('user_id', user.id)

  revalidatePath('/mi-actividad')
}

export async function marcarCompletado(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const postId = formData.get('post_id') as string

  const { data: post } = await supabase
    .from('posts')
    .select('id, user_id, type, title')
    .eq('id', postId)
    .maybeSingle()

  if (!post) return

  // Buscar la postulación aceptada de este post
  const { data: app } = await supabase
    .from('applications')
    .select('id, applicant_id, confirmed_by_client, confirmed_by_worker, completed_at')
    .eq('post_id', postId)
    .eq('status', 'aceptado')
    .maybeSingle()

  if (!app || app.completed_at) return

  const esCliente    = post.user_id === user.id
  const esTrabajador = app.applicant_id === user.id

  if (!esCliente && !esTrabajador) return

  const updates: Record<string, unknown> = {}
  if (esCliente)    updates.confirmed_by_client = true
  if (esTrabajador) updates.confirmed_by_worker = true

  const clienteConfirma    = esCliente    ? true : (app.confirmed_by_client as boolean)
  const trabajadorConfirma = esTrabajador ? true : (app.confirmed_by_worker as boolean)

  const ahoraCompleto = clienteConfirma && trabajadorConfirma
  if (ahoraCompleto) {
    updates.completed_at = new Date().toISOString()
  }

  const { createServiceClient } = await import('@/lib/supabase/service')
  await createServiceClient().from('applications').update(updates).eq('id', app.id)

  // Notificar a ambas partes cuando el trabajo queda 100% completado
  if (ahoraCompleto) {
    await Promise.all([
      crearNotificacion({
        userId:  post.user_id,
        type:    'trabajo_completado',
        message: `El trabajo "${post.title}" fue marcado como completado`,
        link:    `/post/${postId}`,
      }),
      crearNotificacion({
        userId:  app.applicant_id,
        type:    'trabajo_completado',
        message: `El trabajo "${post.title}" fue marcado como completado`,
        link:    `/post/${postId}`,
      }),
      crearNotificacion({
        userId:  post.user_id,
        type:    'recordatorio_calificacion',
        message: `¿Cómo fue tu experiencia en "${post.title}"? Dejá una calificación.`,
        link:    `/post/${postId}`,
      }),
      crearNotificacion({
        userId:  app.applicant_id,
        type:    'recordatorio_calificacion',
        message: `¿Cómo fue tu experiencia en "${post.title}"? Dejá una calificación.`,
        link:    `/post/${postId}`,
      }),
    ])
  }

  revalidatePath(`/post/${postId}`)
}
