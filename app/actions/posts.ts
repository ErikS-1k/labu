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

export async function marcarCompletado(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const postId = formData.get('post_id') as string

  await supabase
    .from('posts')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', postId)
    .eq('user_id', user.id) // solo el dueño puede completar

  revalidatePath(`/post/${postId}`)
}
