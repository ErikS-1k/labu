// Carga de datos de mensajes (solo servidor). La usan /mensajes, /mensajes/[id] y la server
// action que abre un chat en la columna derecha de /mensajes en desktop.
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type Persona = { username: string | null; first_name: string | null; avatar_url: string | null } | null

export type ConversacionResumen = {
  conversation_id: string
  content: string
  created_at: string
  read: boolean
  sender_id: string
  receiver_id: string
  sender: Persona
  receiver: Persona
  unread: number
}

export type ChatData = {
  conversationId: string
  receiverId: string
  postId: string | null
  initialMessages: { id: string; content: string; sender_id: string; created_at: string }[]
  receiverName: string
  receiverHeadline: string | null
  receiverUsername: string | null
  receiverAvatarUrl: string | null
  postTitle: string | null
}

// Lista de conversaciones: último mensaje de cada una + cantidad de no leídos
export async function cargarConversaciones(userId: string): Promise<ConversacionResumen[]> {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('messages')
    .select(`
      conversation_id, content, created_at, read, sender_id, receiver_id,
      sender:sender_id(username, first_name, avatar_url),
      receiver:receiver_id(username, first_name, avatar_url)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(300)

  const mensajes = (rows ?? []) as unknown as Omit<ConversacionResumen, 'unread'>[]

  // No leídos por conversación (mensajes que recibí y todavía no abrí)
  const noLeidos: Record<string, number> = {}
  for (const m of mensajes) {
    if (m.receiver_id === userId && !m.read) noLeidos[m.conversation_id] = (noLeidos[m.conversation_id] ?? 0) + 1
  }

  // Quedar con el último mensaje por conversación (vienen ordenados del más nuevo al más viejo)
  const ultimos: Record<string, Omit<ConversacionResumen, 'unread'>> = {}
  for (const m of mensajes) if (!ultimos[m.conversation_id]) ultimos[m.conversation_id] = m
  return Object.values(ultimos).map(c => ({ ...c, unread: noLeidos[c.conversation_id] ?? 0 }))
}

// Un chat completo. Marca como leídos los mensajes recibidos (abrirlo = leerlo).
// Devuelve null si la conversación no existe o el usuario no participa (la RLS no le
// devuelve mensajes ajenos).
export async function cargarChat(conversationId: string, userId: string): Promise<ChatData | null> {
  const supabase = await createClient()

  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, sender_id, receiver_id, post_id, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (!messages || messages.length === 0) return null

  // Usa serviceClient porque RLS no tiene política UPDATE para receptores
  await createServiceClient()
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .eq('receiver_id', userId)
    .eq('read', false)

  const primero    = messages[0]
  const receiverId = primero.sender_id === userId ? primero.receiver_id : primero.sender_id
  const postId     = primero.post_id ?? null

  const [{ data: receptor }, { data: post }] = await Promise.all([
    supabase.from('users').select('id, username, first_name, headline, avatar_url').eq('id', receiverId).single(),
    postId
      ? supabase.from('posts').select('id, title').eq('id', postId).single()
      : Promise.resolve({ data: null }),
  ])

  return {
    conversationId,
    receiverId,
    postId,
    initialMessages: messages.map(m => ({ id: m.id, content: m.content, sender_id: m.sender_id, created_at: m.created_at })),
    receiverName:      receptor?.first_name ?? receptor?.username ?? 'Usuario',
    receiverHeadline:  receptor?.headline ?? null,
    receiverUsername:  receptor?.username ?? null,
    receiverAvatarUrl: receptor?.avatar_url ?? null,
    postTitle:         post?.title ?? null,
  }
}
