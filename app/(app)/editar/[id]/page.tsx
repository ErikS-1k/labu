import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import PostForm from '@/components/posts/PostForm'

export const metadata: Metadata = { title: 'Editar publicación — Labu' }

export default async function EditarPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getAuthUser()

  const { data: post } = await supabase
    .from('posts')
    .select('id, type, title, description, category, modality, presencialidad, temporal_duration, price, price_type, location, user_id')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!post) notFound()

  return (
    <main className="mx-auto max-w-xl px-4 pb-12 pt-8">
      <PostForm postId={post.id} initialData={post} />
    </main>
  )
}
