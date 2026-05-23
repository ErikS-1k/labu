'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

  if (modality.length === 0) return { error: 'Seleccioná al menos una modalidad.' }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id:    user.id,
      type,
      title:      formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      category:   (formData.get('category') as string) || null,
      modality,
      price:      priceRaw ? parseFloat(priceRaw) : null,
      price_type: (formData.get('price_type') as string) || null,
      location:   (formData.get('location') as string) || null,
    })
    .select('id')
    .single()

  if (error) return { error: 'No se pudo publicar. Intentá de nuevo.' }

  revalidatePath(type === 'oferta' ? '/ofertas' : '/requerimientos')
  redirect(`/post/${data.id}`)
}

export async function eliminarPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const postId = formData.get('post_id') as string
  const type   = formData.get('type')    as string

  await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id)

  redirect(type === 'oferta' ? '/ofertas' : '/requerimientos')
}

export async function cerrarPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const postId = formData.get('post_id') as string
  await supabase.from('posts').update({ is_active: false }).eq('id', postId).eq('user_id', user.id)

  revalidatePath('/mis-publicaciones')
}

export async function marcarCompletado(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const postId = formData.get('post_id') as string

  const { data: post } = await supabase
    .from('posts')
    .select('id, user_id, type')
    .eq('id', postId)
    .maybeSingle()

  if (!post || post.type !== 'requerimiento') return

  // Buscar la postulación aceptada de este post
  const { data: app } = await supabase
    .from('applications')
    .select('id, applicant_id, confirmed_by_client, confirmed_by_worker, completed_at')
    .eq('post_id', postId)
    .eq('status', 'aceptado')
    .maybeSingle()

  if (!app || app.completed_at) return

  const esCliente   = post.user_id === user.id
  const esTrabajador = app.applicant_id === user.id

  if (!esCliente && !esTrabajador) return

  const updates: Record<string, unknown> = {}
  if (esCliente)    updates.confirmed_by_client = true
  if (esTrabajador) updates.confirmed_by_worker = true

  const clienteConfirma   = esCliente    ? true : (app.confirmed_by_client as boolean)
  const trabajadorConfirma = esTrabajador ? true : (app.confirmed_by_worker as boolean)

  if (clienteConfirma && trabajadorConfirma) {
    updates.completed_at = new Date().toISOString()
  }

  const { createServiceClient } = await import('@/lib/supabase/service')
  await createServiceClient().from('applications').update(updates).eq('id', app.id)

  revalidatePath(`/post/${postId}`)
}
