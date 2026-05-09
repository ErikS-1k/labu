import { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import PostCard, { type PostCardData } from '@/components/posts/PostCard'
import FeedFilters from '@/components/posts/FeedFilters'

export const metadata: Metadata = { title: 'Ofertas de trabajo — Labu' }

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Promise<{ busqueda?: string; categoria?: string; modalidad?: string }>
}) {
  const { busqueda, categoria, modalidad } = await searchParams
  const supabase = await createClient()

  const baseSelect = 'id, type, title, description, category, modality, price, price_type, location, created_at, users(username, rating_avg)'

  // Posts inmediatos al tope (solo si no hay filtros activos)
  const hayFiltros = busqueda || categoria || modalidad
  let inmediatos: PostCardData[] = []

  if (!hayFiltros) {
    const { data } = await supabase
      .from('posts')
      .select(baseSelect)
      .eq('type', 'oferta')
      .eq('is_active', true)
      .is('completed_at', null)
      .contains('modality', ['inmediato'])
      .order('created_at', { ascending: false })
      .limit(4)
    inmediatos = (data ?? []) as unknown as PostCardData[]
  }

  let query = supabase
    .from('posts')
    .select(baseSelect)
    .eq('type', 'oferta')
    .eq('is_active', true)
    .is('completed_at', null)
    .order('created_at', { ascending: false })

  if (busqueda)  query = query.or(`title.ilike.%${busqueda}%,description.ilike.%${busqueda}%`)
  if (categoria) query = query.ilike('category', `%${categoria}%`)
  if (modalidad) query = query.contains('modality', [modalidad])

  const { data: posts } = await query

  const inmediatosIds = new Set(inmediatos.map(p => p.id))
  const resto = (posts ?? []) as unknown as PostCardData[]
  const feed = hayFiltros ? resto : resto.filter(p => !inmediatosIds.has(p.id))

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-zinc-900">Ofertas de trabajo</h1>
      <p className="mb-6 text-sm text-zinc-500">Personas que ofrecen sus servicios</p>

      <Suspense>
        <FeedFilters />
      </Suspense>

      {/* Sección Inmediato */}
      {inmediatos.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <h2 className="text-sm font-semibold text-zinc-700">Disponibles ahora</h2>
          </div>
          <div className="flex flex-col gap-3">
            {inmediatos.map(post => <PostCard key={post.id} post={post} />)}
          </div>
          {feed.length > 0 && (
            <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Todas las ofertas
            </p>
          )}
        </section>
      )}

      <div className={inmediatos.length > 0 ? 'flex flex-col gap-3' : 'mt-6 flex flex-col gap-3'}>
        {feed.length > 0
          ? feed.map(post => <PostCard key={post.id} post={post} />)
          : !inmediatos.length && (
            <p className="py-16 text-center text-sm text-zinc-400">
              No hay ofertas todavía.{' '}
              <a href="/publicar" className="underline">¡Publicá la tuya!</a>
            </p>
          )
        }
      </div>
    </main>
  )
}
