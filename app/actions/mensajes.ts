'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function iniciarConversacion(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const postId    = formData.get('post_id')    as string
  const receiverId = formData.get('receiver_id') as string

  // Buscar conversación existente entre estos dos usuarios sobre este post
  const { data: existing } = await supabase
    .from('messages')
    .select('conversation_id')
    .eq('post_id', postId)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
    .limit(1)
    .maybeSingle()

  if (existing) redirect(`/mensajes/${existing.conversation_id}`)

  // Si no existe, generar un nuevo ID y pasar contexto por URL
  const newId = crypto.randomUUID()
  redirect(`/mensajes/nuevo?post_id=${postId}&receiver_id=${receiverId}&conversation_id=${newId}`)
}
