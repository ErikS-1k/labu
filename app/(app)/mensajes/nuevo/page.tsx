import { notFound } from 'next/navigation'
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
    supabase.from('users').select('id, username, first_name, headline, avatar_url').eq('id', receiver_id).single(),
    supabase.from('posts').select('id, title').eq('id', post_id).single(),
  ])

  if (!receptor || !post) notFound()

  return (
    <ConversacionChat
      conversationId={conversation_id}
      currentUserId={user!.id}
      receiverId={receiver_id}
      postId={post_id}
      initialMessages={[]}
      receiverName={receptor.first_name ?? receptor.username ?? 'Usuario'}
      receiverHeadline={receptor.headline ?? null}
      receiverUsername={receptor.username ?? null}
      receiverAvatarUrl={receptor.avatar_url ?? null}
      postTitle={post.title}
      backHref={`/post/${post.id}`}
      isNew
    />
  )
}
