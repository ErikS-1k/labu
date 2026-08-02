import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import ConversacionChat from '@/components/mensajes/ConversacionChat'

export default async function NuevoMensajePage({
  searchParams,
}: {
  searchParams: Promise<{ post_id?: string; receiver_id?: string; conversation_id?: string }>
}) {
  const { post_id, receiver_id, conversation_id } = await searchParams

  if (!post_id || !receiver_id || !conversation_id) notFound()

  const supabase = await createClient()
  const user = await getAuthUser()

  // Cargar receptor y post en paralelo
  const [{ data: receptor }, { data: post }] = await Promise.all([
    supabase.from('users').select('id, username, first_name, headline').eq('id', receiver_id).single(),
    supabase.from('posts').select('id, title').eq('id', post_id).single(),
  ])

  if (!receptor || !post) notFound()

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col px-4 py-4">
      <Link href={`/post/${post.id}`} className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-700">
        ← {post.title}
      </Link>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-surface-2 bg-surface-1">
        <ConversacionChat
          conversationId={conversation_id}
          currentUserId={user!.id}
          receiverId={receiver_id}
          postId={post_id}
          initialMessages={[]}
          receiverName={receptor.first_name ?? receptor.username ?? 'Usuario'}
          receiverHeadline={receptor.headline ?? null}
          isNew
        />
      </div>
    </main>
  )
}
