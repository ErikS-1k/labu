import { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostCard, { type PostCardData } from '@/components/posts/PostCard'
import FeedFilters from '@/components/posts/FeedFilters'
import EmptyFeedState from '@/components/posts/EmptyFeedState'

export const metadata: Metadata = { title: 'Ofertas de trabajo — Labu' }

const PAGE_SIZE = 20

function buildOfertasUrl(params: { busqueda?: string; categoria?: string; modalidad?: string }, pagina: number) {
  const sp = new URLSearchParams()
  if (params.busqueda)  sp.set('busqueda',  params.busqueda)
  if (params.categoria) sp.set('categoria', params.categoria)
  if (params.modalidad) sp.set('modalidad', params.modalidad)
  if (pagina > 0)       sp.set('pagina',    String(pagina))
  const qs = sp.toString()
  return `/ofertas${qs ? `?${qs}` : ''}`
}

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Promise<{ busqueda?: string; categoria?: string; modalidad?: string; pagina?: string }>
}) {
  const { busqueda, categoria, modalidad, pagina: paginaParam } = await searchParams
  const pagina = Math.max(0, parseInt(paginaParam ?? '0') || 0)
  const offset = pagina * PAGE_SIZE

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const baseSelect = 'id, user_id, type, title, description, category, modality, presencialidad, temporal_duration, price, price_type, location, created_at, users(username, first_name, fecha_nacimiento, rating_avg, avatar_url)'

  // Posts inmediatos al tope (solo si no hay filtros activos y es página 0)
  const hayFiltros = busqueda || categoria || modalidad
  let inmediatos: PostCardData[] = []

  if (!hayFiltros && pagina === 0) {
    const { data } = await supabase
      .from('posts')
      .select(baseSelect)
      .eq('type', 'oferta')
      .eq('is_active', true)
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
    .order('created_at', { ascending: false })

  if (busqueda)  query = query.or(`title.ilike.%${busqueda}%,description.ilike.%${busqueda}%`)
  if (categoria) query = query.ilike('category', `%${categoria}%`)
  if (modalidad) query = query.contains('modality', [modalidad])

  query = query.range(offset, offset + PAGE_SIZE - 1)
  const { data: posts } = await query

  const inmediatosIds = pagina === 0 ? new Set(inmediatos.map(p => p.id)) : new Set<string>()
  const resto = (posts ?? []) as unknown as PostCardData[]
  const feed = hayFiltros ? resto : resto.filter(p => !inmediatosIds.has(p.id))

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-white">Servicios disponibles</h1>
      <p className="mb-6 text-sm text-zinc-400">Personas que ofrecen sus servicios</p>

      <Suspense>
        <FeedFilters />
      </Suspense>

      {/* Sección Inmediato */}
      {inmediatos.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <h2 className="text-sm font-semibold text-zinc-300">Disponibles ahora</h2>
          </div>
          <div className="flex flex-col gap-4">
            {inmediatos.map(post => <PostCard key={post.id} post={post} from="panel" />)}
          </div>
          {feed.length > 0 && (
            <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Todos los servicios
            </p>
          )}
        </section>
      )}

      <div className={inmediatos.length > 0 ? 'flex flex-col gap-4' : 'mt-6 flex flex-col gap-4'}>
        {feed.length > 0
          ? feed.map(post => <PostCard key={post.id} post={post} from="panel" />)
          : !inmediatos.length && (
            <EmptyFeedState
              busqueda={busqueda}
              tipo="oferta"
              isLoggedIn={!!user}
              hayFiltros={!!hayFiltros}
            />
          )
        }
      </div>

      {/* Paginación */}
      {(pagina > 0 || feed.length === PAGE_SIZE) && (
        <div className="mt-8 flex items-center justify-between border-t border-surface-2 pt-6">
          {pagina > 0 ? (
            <Link href={buildOfertasUrl({ busqueda, categoria, modalidad }, pagina - 1)} className="text-sm text-zinc-400 transition-colors hover:text-white">
              ← Anterior
            </Link>
          ) : <span />}
          {feed.length === PAGE_SIZE && (
            <Link href={buildOfertasUrl({ busqueda, categoria, modalidad }, pagina + 1)} className="text-sm text-zinc-400 transition-colors hover:text-white">
              Siguiente →
            </Link>
          )}
        </div>
      )}
    </main>
  )
}
