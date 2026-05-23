import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ConversacionChat from '@/components/mensajes/ConversacionChat'

export default async function ConversacionPage({
  params,
}: {
  params: Promise<{ conversation_id: string }>
}) {
  const { conversation_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar mensajes de la conversación
  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, sender_id, receiver_id, post_id, created_at')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: true })

  if (!messages || messages.length === 0) notFound()

  const primero = messages[0]
  const receiverId = primero.sender_id === user.id ? primero.receiver_id : primero.sender_id
  const postId     = primero.post_id ?? null

  // Cargar receptor y post en paralelo
  const [{ data: receptor }, { data: post }] = await Promise.all([
    supabase.from('users').select('id, username, first_name').eq('id', receiverId).single(),
    postId
      ? supabase.from('posts').select('id, title').eq('id', postId).single()
      : Promise.resolve({ data: null }),
  ])

  return (
    <main className="mx-auto flex max-w-xl flex-col px-4 py-8" style={{ height: 'calc(100vh - 57px)' }}>
      <Link href="/mensajes" className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-700">
        ← Mensajes
      </Link>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-surface-2 bg-surface-1">
        <ConversacionChat
          conversationId={conversation_id}
          currentUserId={user.id}
          receiverId={receiverId}
          postId={postId}
          initialMessages={messages.map(m => ({
            id: m.id,
            content: m.content,
            sender_id: m.sender_id,
            created_at: m.created_at,
          }))}
          receiverName={receptor?.first_name ?? receptor?.username ?? 'Usuario'}
          postTitle={post?.title}
        />
      </div>
    </main>
  )
}
