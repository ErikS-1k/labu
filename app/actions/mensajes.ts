'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { crearNotificacion } from './notifications'
import { enviarPushNotification } from './push'

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

export async function enviarMensaje(params: {
  conversationId: string
  receiverId: string
  postId: string | null
  content: string
}): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await createServiceClient()
    .from('messages')
    .insert({
      conversation_id: params.conversationId,
      sender_id:       user.id,
      receiver_id:     params.receiverId,
      post_id:         params.postId,
      content:         params.content,
    })

  if (error) {
    console.error('[enviarMensaje]', error.message)
    return { error: 'No se pudo enviar el mensaje. Intentá de nuevo.' }
  }

  await Promise.all([
    crearNotificacion({
      userId:  params.receiverId,
      type:    'nuevo_mensaje',
      message: 'Tenés un mensaje nuevo',
      link:    `/mensajes/${params.conversationId}`,
    }),
    enviarPushNotification(params.receiverId, {
      title: 'Nuevo mensaje en Labu',
      body:  params.content.slice(0, 60),
      url:   `/mensajes/${params.conversationId}`,
    }),
  ])

  return { error: null }
}
