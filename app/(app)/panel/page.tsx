import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import PostCard, { type PostCardData } from '@/components/posts/PostCard'
import FeedFilters from '@/components/posts/FeedFilters'

const baseSelect = 'id, type, title, description, category, modality, price, price_type, location, created_at, users(username, rating_avg)'

async function FeedOfertas({ busqueda, categoria, modalidad }: { busqueda?: string; categoria?: string; modalidad?: string }) {
  const supabase = await createClient()
  const hayFiltros = busqueda || categoria || modalidad
  let inmediatos: PostCardData[] = []

  if (!hayFiltros) {
    const { data } = await supabase.from('posts').select(baseSelect)
      .eq('type', 'oferta').eq('is_active', true).is('completed_at', null)
      .contains('modality', ['inmediato']).order('created_at', { ascending: false }).limit(4)
    inmediatos = (data ?? []) as unknown as PostCardData[]
  }

  let query = supabase.from('posts').select(baseSelect)
    .eq('type', 'oferta').eq('is_active', true).is('completed_at', null)
    .order('created_at', { ascending: false })

  if (busqueda)  query = query.or(`title.ilike.%${busqueda}%,description.ilike.%${busqueda}%`)
  if (categoria) query = query.ilike('category', `%${categoria}%`)
  if (modalidad) query = query.contains('modality', [modalidad])

  const { data: posts } = await query
  const ids = new Set(inmediatos.map(p => p.id))
  const resto = (posts ?? []) as unknown as PostCardData[]
  const feed = hayFiltros ? resto : resto.filter(p => !ids.has(p.id))

  return (
    <div>
      {inmediatos.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <p className="text-sm font-semibold text-zinc-700">Disponibles ahora</p>
          </div>
          <div className="flex flex-col gap-3">
            {inmediatos.map(p => <PostCard key={p.id} post={p} />)}
          </div>
          {feed.length > 0 && <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Todas las ofertas</p>}
        </section>
      )}
      <div className="flex flex-col gap-3">
        {feed.length > 0
          ? feed.map(p => <PostCard key={p.id} post={p} />)
          : !inmediatos.length && (
            <p className="py-12 text-center text-sm text-zinc-400">
              No hay ofertas todavía. <a href="/publicar" className="underline">¡Publicá la tuya!</a>
            </p>
          )
        }
      </div>
    </div>
  )
}

async function FeedRequerimientos({ busqueda, categoria, modalidad }: { busqueda?: string; categoria?: string; modalidad?: string }) {
  const supabase = await createClient()
  const hayFiltros = busqueda || categoria || modalidad
  let urgentes: PostCardData[] = []

  if (!hayFiltros) {
    const { data } = await supabase.from('posts').select(baseSelect)
      .eq('type', 'requerimiento').eq('is_active', true).is('completed_at', null)
      .contains('modality', ['inmediato']).order('created_at', { ascending: false }).limit(4)
    urgentes = (data ?? []) as unknown as PostCardData[]
  }

  let query = supabase.from('posts').select(baseSelect)
    .eq('type', 'requerimiento').eq('is_active', true).is('completed_at', null)
    .order('created_at', { ascending: false })

  if (busqueda)  query = query.or(`title.ilike.%${busqueda}%,description.ilike.%${busqueda}%`)
  if (categoria) query = query.ilike('category', `%${categoria}%`)
  if (modalidad) query = query.contains('modality', [modalidad])

  const { data: posts } = await query
  const ids = new Set(urgentes.map(p => p.id))
  const resto = (posts ?? []) as unknown as PostCardData[]
  const feed = hayFiltros ? resto : resto.filter(p => !ids.has(p.id))

  return (
    <div>
      {urgentes.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <p className="text-sm font-semibold text-zinc-700">Urgentes ahora</p>
          </div>
          <div className="flex flex-col gap-3">
            {urgentes.map(p => <PostCard key={p.id} post={p} />)}
          </div>
          {feed.length > 0 && <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Todos los requerimientos</p>}
        </section>
      )}
      <div className="flex flex-col gap-3">
        {feed.length > 0
          ? feed.map(p => <PostCard key={p.id} post={p} />)
          : !urgentes.length && (
            <p className="py-12 text-center text-sm text-zinc-400">
              No hay requerimientos todavía. <a href="/publicar" className="underline">¡Publicá el tuyo!</a>
            </p>
          )
        }
      </div>
    </div>
  )
}

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; busqueda?: string; categoria?: string; modalidad?: string }>
}) {
  const { tab, busqueda, categoria, modalidad } = await searchParams
  const tabActiva = tab === 'ofertas' || tab === 'requerimientos' ? tab : null

  return (
    <div>
      {/* Hero negro con tabs */}
      <div
        className="relative overflow-hidden bg-black py-16 text-white"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff12 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 60%, transparent 20%, #000000 75%)',
        }} />

        <div className="relative mx-auto max-w-2xl px-4 text-center">
          {!tabActiva && (
            <p className="mb-8 text-sm font-medium tracking-widest text-zinc-500 uppercase">
              ¿Qué estás buscando hoy?
            </p>
          )}

          <div className="flex justify-center gap-4">
            <Link
              href="/panel?tab=ofertas"
              className={`rounded-2xl border px-10 py-5 text-lg font-semibold transition-all duration-200 ${
                tabActiva === 'ofertas'
                  ? 'border-white bg-white/10 text-white shadow-[0_0_24px_rgba(255,255,255,0.15)]'
                  : 'border-white/20 text-zinc-400 hover:border-white/40 hover:text-white/80'
              }`}
            >
              Ofertas
            </Link>
            <Link
              href="/panel?tab=requerimientos"
              className={`rounded-2xl border px-10 py-5 text-lg font-semibold transition-all duration-200 ${
                tabActiva === 'requerimientos'
                  ? 'border-white bg-white/10 text-white shadow-[0_0_24px_rgba(255,255,255,0.15)]'
                  : 'border-white/20 text-zinc-400 hover:border-white/40 hover:text-white/80'
              }`}
            >
              Requerimientos
            </Link>
          </div>
        </div>
      </div>

      {/* Feed */}
      {tabActiva && (
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Suspense>
            <FeedFilters />
          </Suspense>
          <div className="mt-6">
            {tabActiva === 'ofertas'
              ? <FeedOfertas busqueda={busqueda} categoria={categoria} modalidad={modalidad} />
              : <FeedRequerimientos busqueda={busqueda} categoria={categoria} modalidad={modalidad} />
            }
          </div>
        </div>
      )}
    </div>
  )
}
