import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import EditarPostForm from '@/components/posts/EditarPostForm'

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
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-white">Editar publicación</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Modificá los campos que quieras y guardá los cambios.
      </p>
      <EditarPostForm post={post} />
    </main>
  )
}
