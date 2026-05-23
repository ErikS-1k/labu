import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CerrarPostButton from '@/components/posts/CerrarPostButton'
import EliminarPostButton from '@/components/posts/EliminarPostButton'

export const metadata = { title: 'Mis publicaciones' }

export default async function MisPublicacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: posts } = await supabase
    .from('posts')
    .select('id, type, title, category, modality, is_active, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const postIds = (posts ?? []).map(p => p.id)

  let countsByPost: Record<string, number> = {}
  if (postIds.length > 0) {
    const { data: apps } = await supabase
      .from('applications')
      .select('post_id')
      .in('post_id', postIds)

    for (const app of apps ?? []) {
      countsByPost[app.post_id] = (countsByPost[app.post_id] ?? 0) + 1
    }
  }

  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Mis publicaciones</h1>
        <Link href="/publicar" className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-700">
          + Publicar
        </Link>
      </div>

      {(!posts || posts.length === 0) ? (
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-zinc-500">Todavía no publicaste nada.</p>
          <Link href="/publicar" className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700">
            Crear primera publicación
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(post => {
            const appCount = countsByPost[post.id] ?? 0
            const label = post.type === 'oferta' ? 'Oferta' : 'Requerimiento'
            const modalities = (post.modality as string[] | null) ?? []

            return (
              <div key={post.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        post.type === 'oferta' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {label}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        post.is_active ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        {post.is_active ? 'Activo' : 'Cerrado'}
                      </span>
                      {modalities.map(m => (
                        <span key={m} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 capitalize">{m}</span>
                      ))}
                    </div>
                    <p className="font-medium text-zinc-900 leading-snug truncate">{post.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                      {post.category && <span>{post.category}</span>}
                      <span>{formatDate(post.created_at)}</span>
                      <span>{appCount} {appCount === 1 ? 'postulación' : 'postulaciones'}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/post/${post.id}`}
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white transition-colors hover:bg-zinc-700"
                    >
                      Ver
                    </Link>
                    {post.is_active && <CerrarPostButton postId={post.id} />}
                    <EliminarPostButton
                      postId={post.id}
                      type={post.type}
                      label="Eliminar"
                      className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-50"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
