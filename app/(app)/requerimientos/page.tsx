import { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import PostCard, { type PostCardData } from '@/components/posts/PostCard'
import FeedFilters from '@/components/posts/FeedFilters'
import EmptyFeedState from '@/components/posts/EmptyFeedState'

export const metadata: Metadata = { title: 'Requerimientos — Labu' }

export default async function RequerimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ busqueda?: string; categoria?: string; modalidad?: string }>
}) {
  const { busqueda, categoria, modalidad } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const baseSelect = 'id, user_id, type, title, description, category, modality, presencialidad, temporal_duration, price, price_type, location, created_at, users(username, first_name, fecha_nacimiento, rating_avg, avatar_url)'

  // Posts urgentes al tope (solo si no hay filtros activos)
  const hayFiltros = busqueda || categoria || modalidad
  let urgentes: PostCardData[] = []

  if (!hayFiltros) {
    const { data } = await supabase
      .from('posts')
      .select(baseSelect)
      .eq('type', 'requerimiento')
      .eq('is_active', true)
      .contains('modality', ['inmediato'])
      .order('created_at', { ascending: false })
      .limit(4)
    urgentes = (data ?? []) as unknown as PostCardData[]
  }

  let query = supabase
    .from('posts')
    .select(baseSelect)
    .eq('type', 'requerimiento')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (busqueda)  query = query.or(`title.ilike.%${busqueda}%,description.ilike.%${busqueda}%`)
  if (categoria) query = query.ilike('category', `%${categoria}%`)
  if (modalidad) query = query.contains('modality', [modalidad])

  const { data: posts } = await query

  const urgentesIds = new Set(urgentes.map(p => p.id))
  const resto = (posts ?? []) as unknown as PostCardData[]
  const feed = hayFiltros ? resto : resto.filter(p => !urgentesIds.has(p.id))

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-white">Búsquedas activas</h1>
      <p className="mb-6 text-sm text-zinc-400">Personas que buscan trabajo o un servicio</p>

      <Suspense>
        <FeedFilters />
      </Suspense>

      {/* Sección Inmediato */}
      {urgentes.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <h2 className="text-sm font-semibold text-zinc-300">Urgentes ahora</h2>
          </div>
          <div className="flex flex-col gap-4">
            {urgentes.map(post => <PostCard key={post.id} post={post} />)}
          </div>
          {feed.length > 0 && (
            <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Todas las búsquedas
            </p>
          )}
        </section>
      )}

      <div className={urgentes.length > 0 ? 'flex flex-col gap-4' : 'mt-6 flex flex-col gap-4'}>
        {feed.length > 0
          ? feed.map(post => <PostCard key={post.id} post={post} />)
          : !urgentes.length && (
            <EmptyFeedState
              busqueda={busqueda}
              tipo="requerimiento"
              isLoggedIn={!!user}
              hayFiltros={!!hayFiltros}
            />
          )
        }
      </div>
    </main>
  )
}
