'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { crearNotificacion } from './notifications'

export async function calificar(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tenés que estar logueado.', ok: false }

  const score = parseInt(formData.get('score') as string)
  if (!score || score < 1 || score > 5)
    return { error: 'Seleccioná una puntuación del 1 al 5.', ok: false }

  const postId    = formData.get('post_id')    as string
  const toUserId  = formData.get('to_user_id') as string
  const comment   = (formData.get('comment') as string).trim() || null

  const { error } = await supabase.from('ratings').insert({
    from_user_id: user.id,
    to_user_id:   toUserId,
    post_id:      postId,
    score,
    comment,
  })

  if (error?.code === '23505') return { error: 'Ya calificaste este trabajo.', ok: false }
  if (error) return { error: 'No se pudo guardar. Intentá de nuevo.', ok: false }

  const { data: post } = await supabase.from('posts').select('title').eq('id', postId).single()
  if (post) {
    await crearNotificacion({
      userId:  toUserId,
      type:    'nuevo_rating',
      message: `Recibiste una calificación de ${score} estrellas en "${post.title}"`,
      link:    `/post/${postId}`,
    })
  }

  revalidatePath(`/post/${postId}`)
  revalidatePath('/mi-actividad')
  return { error: null, ok: true }
}
