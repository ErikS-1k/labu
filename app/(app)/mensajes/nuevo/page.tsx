import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ConversacionChat from '@/components/mensajes/ConversacionChat'

export default async function NuevoMensajePage({
  searchParams,
}: {
  searchParams: Promise<{ post_id?: string; receiver_id?: string; conversation_id?: string }>
}) {
  const { post_id, receiver_id, conversation_id } = await searchParams

  if (!post_id || !receiver_id || !conversation_id) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Si ya existe una conversación para este par, redirigir
  const { data: existing } = await supabase
    .from('messages')
    .select('conversation_id')
    .eq('post_id', post_id)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${user.id})`)
    .limit(1)
    .maybeSingle()

  if (existing) redirect(`/mensajes/${existing.conversation_id}`)

  // Cargar receptor y post en paralelo
  const [{ data: receptor }, { data: post }] = await Promise.all([
    supabase.from('users').select('id, username, first_name').eq('id', receiver_id).single(),
    supabase.from('posts').select('id, title').eq('id', post_id).single(),
  ])

  if (!receptor || !post) notFound()

  return (
    <main className="mx-auto flex max-w-xl flex-col px-4 py-8" style={{ height: 'calc(100dvh - 57px)' }}>
      <Link href={`/post/${post.id}`} className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-700">
        ← {post.title}
      </Link>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-surface-2 bg-surface-1">
        <ConversacionChat
          conversationId={conversation_id}
          currentUserId={user.id}
          receiverId={receiver_id}
          postId={post_id}
          initialMessages={[]}
          receiverName={receptor.first_name ?? receptor.username ?? 'Usuario'}
          postTitle={post.title}
          isNew
        />
      </div>
    </main>
  )
}
