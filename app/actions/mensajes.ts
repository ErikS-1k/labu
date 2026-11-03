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

  const { data: senderUser } = await supabase
    .from('users').select('first_name, username').eq('id', user.id).single()
  const senderName = senderUser?.first_name || senderUser?.username || 'Mensaje nuevo'

  const trunc = (s: string, n = 100) => s.length > n ? s.slice(0, n) + '...' : s

  await Promise.all([
    crearNotificacion({
      userId:  params.receiverId,
      type:    'nuevo_mensaje',
      message: 'Tenés un mensaje nuevo',
      link:    `/mensajes/${params.conversationId}`,
    }),
    enviarPushNotification(params.receiverId, {
      title: senderName,
      body:  trunc(params.content),
      url:   `/mensajes/${params.conversationId}`,
    }),
  ])

  return { error: null }
}

// Marca como leídos los mensajes recibidos en una conversación que el usuario tiene abierta.
// Usa serviceClient porque RLS no tiene política UPDATE para receptores (igual que la página
// del chat al abrirse). Seguro: el receiver_id sale de la sesión, nunca del cliente.
export async function marcarConversacionLeida(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || typeof conversationId !== 'string' || !conversationId) return

  const { error } = await createServiceClient()
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .eq('receiver_id', user.id)
    .eq('read', false)

  if (error) console.error('[marcarConversacionLeida]', error.message)
}

// Abre un chat en la columna derecha de /mensajes (desktop), sin navegar.
// Misma carga que /mensajes/[id], incluido marcar como leído.
export async function abrirConversacion(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || typeof conversationId !== 'string' || !conversationId) return null
  const { cargarChat } = await import('@/lib/conversacion')
  return cargarChat(conversationId, user.id)
}
