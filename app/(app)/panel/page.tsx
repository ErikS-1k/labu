import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import PostCard, { type PostCardData } from '@/components/posts/PostCard'
import FeedFilters from '@/components/posts/FeedFilters'
import PanelSection from '@/components/panel/PanelSection'

const baseSelect = 'id, type, title, description, category, modality, price, price_type, location, created_at, users(username, rating_avg, avatar_url)'

async function FeedOfertas({ busqueda, categoria, modalidad }: { busqueda?: string; categoria?: string; modalidad?: string }) {
  const supabase = await createClient()
  const hayFiltros = busqueda || categoria || modalidad
  let inmediatos: PostCardData[] = []

  if (!hayFiltros) {
    const { data } = await supabase.from('posts').select(baseSelect)
      .eq('type', 'oferta').eq('is_active', true).contains('modality', ['inmediato'])
      .order('created_at', { ascending: false }).limit(4)
    inmediatos = (data ?? []) as unknown as PostCardData[]
  }

  let query = supabase.from('posts').select(baseSelect)
    .eq('type', 'oferta').eq('is_active', true).order('created_at', { ascending: false })

  if (busqueda)  query = query.or(`title.ilike.%${busqueda}%,description.ilike.%${busqueda}%`)
  if (categoria) query = query.ilike('category', `%${categoria}%`)
  if (modalidad) query = query.contains('modality', [modalidad])

  const { data: posts } = await query
  const ids  = new Set(inmediatos.map(p => p.id))
  const resto = (posts ?? []) as unknown as PostCardData[]
  const feed  = hayFiltros ? resto : resto.filter(p => !ids.has(p.id))

  return (
    <div>
      {inmediatos.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <p className="text-sm font-semibold text-zinc-300">Disponibles ahora</p>
          </div>
          <div className="flex flex-col gap-3">
            {inmediatos.map(p => <PostCard key={p.id} post={p} />)}
          </div>
          {feed.length > 0 && <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Todos los servicios</p>}
        </section>
      )}
      <div className="flex flex-col gap-3">
        {feed.length > 0
          ? feed.map(p => <PostCard key={p.id} post={p} />)
          : !inmediatos.length && (
            <p className="py-12 text-center text-sm text-zinc-400">
              No hay servicios todavía. <a href="/publicar" className="underline">¡Publicá el tuyo!</a>
            </p>
          )
        }
      </div>
    </div>
  )
}

async function FeedBusquedas({ busqueda, categoria, modalidad }: { busqueda?: string; categoria?: string; modalidad?: string }) {
  const supabase = await createClient()
  const hayFiltros = busqueda || categoria || modalidad
  let urgentes: PostCardData[] = []

  if (!hayFiltros) {
    const { data } = await supabase.from('posts').select(baseSelect)
      .eq('type', 'requerimiento').eq('is_active', true).contains('modality', ['inmediato'])
      .order('created_at', { ascending: false }).limit(4)
    urgentes = (data ?? []) as unknown as PostCardData[]
  }

  let query = supabase.from('posts').select(baseSelect)
    .eq('type', 'requerimiento').eq('is_active', true).order('created_at', { ascending: false })

  if (busqueda)  query = query.or(`title.ilike.%${busqueda}%,description.ilike.%${busqueda}%`)
  if (categoria) query = query.ilike('category', `%${categoria}%`)
  if (modalidad) query = query.contains('modality', [modalidad])

  const { data: posts } = await query
  const ids   = new Set(urgentes.map(p => p.id))
  const resto = (posts ?? []) as unknown as PostCardData[]
  const feed  = hayFiltros ? resto : resto.filter(p => !ids.has(p.id))

  return (
    <div>
      {urgentes.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <p className="text-sm font-semibold text-zinc-300">Urgentes ahora</p>
          </div>
          <div className="flex flex-col gap-3">
            {urgentes.map(p => <PostCard key={p.id} post={p} />)}
          </div>
          {feed.length > 0 && <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Todas las búsquedas</p>}
        </section>
      )}
      <div className="flex flex-col gap-3">
        {feed.length > 0
          ? feed.map(p => <PostCard key={p.id} post={p} />)
          : !urgentes.length && (
            <p className="py-12 text-center text-sm text-zinc-400">
              No hay búsquedas todavía. <a href="/publicar" className="underline">¡Publicá la tuya!</a>
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
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const ofOpen  = params.of  === '1'
  const reqOpen = params.req === '1'

  return (
    <div>
      {/* Hero */}
      <div
        className="relative overflow-hidden bg-surface-0 py-14 text-white"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff10 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 60%, transparent 20%, #0f0f0f 75%)',
        }} />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <p className="text-sm font-medium tracking-widest text-zinc-500 uppercase mb-3">
            ¿Qué estás buscando hoy?
          </p>
          <h1 className="text-3xl font-bold text-white">Encontrá trabajo o talento</h1>
          <p className="mt-2 text-sm text-zinc-400">Abrí la sección que te interesa para explorar el feed.</p>
        </div>
      </div>

      {/* Dos columnas */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* Servicios (Ofertas) */}
          <PanelSection
            title="Ofrezco mis servicios"
            subtitle="Personas que ofrecen trabajo o freelance"
            openParam="of"
            isOpen={ofOpen}
          >
            <Suspense>
              <FeedFilters
                paramPrefix="of_"
                preserveParams={['of', 'req']}
              />
            </Suspense>
            <div className="mt-6">
              <FeedOfertas
                busqueda={params.of_busqueda}
                categoria={params.of_categoria}
                modalidad={params.of_modalidad}
              />
            </div>
          </PanelSection>

          {/* Búsquedas (Requerimientos) */}
          <PanelSection
            title="Necesito contratar"
            subtitle="Personas que buscan un servicio o profesional"
            openParam="req"
            isOpen={reqOpen}
          >
            <Suspense>
              <FeedFilters
                paramPrefix="req_"
                preserveParams={['of', 'req']}
              />
            </Suspense>
            <div className="mt-6">
              <FeedBusquedas
                busqueda={params.req_busqueda}
                categoria={params.req_categoria}
                modalidad={params.req_modalidad}
              />
            </div>
          </PanelSection>

        </div>
      </div>
    </div>
  )
}
