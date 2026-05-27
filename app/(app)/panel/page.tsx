import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostCard, { type PostCardData } from '@/components/posts/PostCard'
import FeedFilters from '@/components/posts/FeedFilters'

export const metadata = { title: 'Inicio — Labu' }

const baseSelect = 'id, type, title, description, category, modality, price, price_type, location, created_at, users(username, rating_avg, avatar_url)'

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const tipo      = params.tipo
  const busqueda  = params.busqueda
  const categoria = params.categoria
  const modalidad = params.modalidad

  const supabase   = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const hayFiltros = tipo || busqueda || categoria || modalidad

  // Sección "Disponibles ahora" — solo cuando no hay filtros activos
  let inmediatos: PostCardData[] = []
  if (!hayFiltros) {
    const { data } = await supabase
      .from('posts')
      .select(baseSelect)
      .eq('is_active', true)
      .contains('modality', ['inmediato'])
      .order('created_at', { ascending: false })
      .limit(4)
    inmediatos = (data ?? []) as unknown as PostCardData[]
  }

  // Feed principal
  let query = supabase
    .from('posts')
    .select(baseSelect)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (tipo === 'oferta')             query = query.eq('type', 'oferta')
  else if (tipo === 'requerimiento') query = query.eq('type', 'requerimiento')
  if (busqueda)  query = query.or(`title.ilike.%${busqueda}%,description.ilike.%${busqueda}%`)
  if (categoria) query = query.ilike('category', `%${categoria}%`)
  if (modalidad) query = query.contains('modality', [modalidad])

  const { data: posts } = await query
  const inmediatosIds   = new Set(inmediatos.map(p => p.id))
  const feed = ((posts ?? []) as unknown as PostCardData[]).filter(p => !inmediatosIds.has(p.id))

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">

      {/* Acciones de publicación — solo para logueados */}
      {user && (
        <div className="mb-8 grid grid-cols-2 gap-3">
          <Link
            href="/publicar?tipo=oferta"
            className="flex flex-col items-center gap-2 rounded-xl border border-green-800/50 bg-green-900/20 px-4 py-5 text-center transition-colors hover:bg-green-900/40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <span className="text-sm font-semibold text-green-400">Publicar mi servicio</span>
          </Link>
          <Link
            href="/publicar?tipo=requerimiento"
            className="flex flex-col items-center gap-2 rounded-xl border border-blue-800/50 bg-blue-900/20 px-4 py-5 text-center transition-colors hover:bg-blue-900/40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span className="text-sm font-semibold text-blue-400">Publicar una búsqueda</span>
          </Link>
        </div>
      )}

      {/* Separador "Explorar" */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1 border-t border-surface-2" />
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Explorar publicaciones</span>
        <div className="flex-1 border-t border-surface-2" />
      </div>

      {/* Filtros */}
      <Suspense>
        <FeedFilters showTypeTabs />
      </Suspense>

      {/* Sección inmediatos */}
      {inmediatos.length > 0 && (
        <section className="mt-6 mb-2">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <p className="text-sm font-semibold text-zinc-300">Disponibles ahora</p>
          </div>
          <div className="flex flex-col gap-3">
            {inmediatos.map(p => <PostCard key={p.id} post={p} />)}
          </div>
          {feed.length > 0 && (
            <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Todos los posts
            </p>
          )}
        </section>
      )}

      {/* Feed principal */}
      <div className="flex flex-col gap-3 mt-6">
        {feed.length > 0
          ? feed.map(p => <PostCard key={p.id} post={p} />)
          : !inmediatos.length && (
            <p className="py-16 text-center text-sm text-zinc-400">
              No hay publicaciones todavía.{' '}
              <a href="/publicar" className="underline">¡Publicá la primera!</a>
            </p>
          )
        }
      </div>

    </div>
  )
}
