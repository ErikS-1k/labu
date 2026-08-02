import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ConversacionList from '@/components/mensajes/ConversacionList'

export const metadata: Metadata = { title: 'Mensajes — Labu' }

type MensajeRow = {
  conversation_id: string
  content: string
  created_at: string
  read: boolean
  sender_id: string
  receiver_id: string
  sender: { username: string | null; first_name: string | null; headline: string | null } | null
  receiver: { username: string | null; first_name: string | null; headline: string | null } | null
}

export default async function MensajesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from('messages')
    .select(`
      conversation_id, content, created_at, read, sender_id, receiver_id,
      sender:sender_id(username, first_name, headline),
      receiver:receiver_id(username, first_name, headline)
    `)
    .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
    .order('created_at', { ascending: false })
    .limit(300)

  // Quedar con el último mensaje por conversación
  const conversaciones = Object.values(
    ((rows ?? []) as unknown as MensajeRow[]).reduce<Record<string, MensajeRow>>(
      (acc, msg) => { if (!acc[msg.conversation_id]) acc[msg.conversation_id] = msg; return acc },
      {}
    )
  )

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-white">Mensajes</h1>
      <ConversacionList initialConversaciones={conversaciones} currentUserId={user!.id} />
    </main>
  )
}
