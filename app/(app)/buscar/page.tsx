import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAuthUser } from '@/lib/auth'
import { avatarBg } from '@/lib/avatar'
import { buscar } from '@/app/actions/search'
import {
  contarFiltrosActivos,
  parseFiltros,
  sanitizarTerminos,
  type SearchPost,
  type SearchResults,
  type SearchUser,
} from '@/lib/search'
import PostCard, { POST_CARD_SELECT } from '@/components/posts/PostCard'
import SearchForm from '@/components/search/SearchForm'
import SearchTabs from '@/components/search/SearchTabs'
import SearchFilters from '@/components/search/SearchFilters'
import CategoriaSugerencias from '@/components/search/CategoriaSugerencias'
import PublicarBusquedaCTA from '@/components/search/PublicarBusquedaCTA'
import { SearchNavigationProvider, SearchPendingArea } from '@/components/search/SearchNavigation'
import PageHeader from '@/components/ui/PageHeader'

// Listado por defecto (sin texto buscado). Campos definidos junto a PostCard.
const postSelect = POST_CARD_SELECT
const PAGE_SIZE = 20

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

function PerfilCard({ u }: { u: SearchUser }) {
  const nombre  = u.first_name ?? u.username ?? 'Usuario'
  const inicial = nombre[0].toUpperCase()
  return (
    <Link
      href={`/perfil/${u.id}`}
      className="flex items-center gap-3 rounded-xl border border-surface-2 bg-surface-1 p-4 transition-colors hover:bg-surface-2"
    >
      <div className={`h-10 w-10 shrink-0 overflow-hidden rounded-full ${!u.avatar_url ? avatarBg(u.username, u.first_name, u.id) : ''}`}>
        {u.avatar_url
          ? <Image src={u.avatar_url} width={40} height={40} sizes="40px" className="object-cover" alt={nombre} />
          : <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">{inicial}</span>
        }
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{nombre}</p>
        {u.headline && <p className="truncate text-sm text-zinc-400">{u.headline}</p>}
        {u.location && <p className="text-xs text-zinc-500">{u.location}</p>}
      </div>
      {(u.rating_count ?? 0) > 0 && (
        <span className="shrink-0 text-xs text-zinc-400">★ {u.rating_avg}</span>
      )}
    </Link>
  )
}

function SeccionHeader({ titulo, total, mostrados }: { titulo: string; total: string; mostrados?: number }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{titulo}</h2>
      <p className="text-xs text-zinc-500">
        {total}
        {mostrados != null && <span className="text-zinc-600"> · las {mostrados} más relevantes</span>}
      </p>
    </div>
  )
}

function ErrorCard({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(239,68,68,0.3)] bg-[rgba(127,29,29,0.15)] px-6 py-8 text-center">
      <p className="font-medium text-red-300">Algo salió mal</p>
      <p className="mt-1 text-sm text-zinc-400">{mensaje}</p>
    </div>
  )
}

function SinResultados({ q, logueado }: { q: string; logueado: boolean }) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#171717] px-5 py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(59,130,246,0.12)] text-blue-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <p className="font-semibold text-white">
        No encontramos resultados para <span className="text-blue-400">“{q}”</span>
      </p>
      <p className="mt-1.5 text-sm text-zinc-400">Probá buscar con otras palabras o revisá los filtros.</p>

      {/* Bloque 1 — sugerencias de categorías */}
      <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Ampliá tu búsqueda
      </p>
      <CategoriaSugerencias />

      {/* Bloque 2 — publicar un requerimiento con lo buscado (solo existe con texto buscado) */}
      {q && (
        <div className="mt-8 border-t border-[#2a2a2a] pt-8">
          <PublicarBusquedaCTA q={q} logueado={logueado} />
        </div>
      )}
    </div>
  )
}

function ResultadosBusqueda({ q, resultados, logueado }: { q: string; resultados: SearchResults; logueado: boolean }) {
  const { posts, users, totalPosts, totalUsers } = resultados
  if (posts.length === 0 && users.length === 0) return <SinResultados q={q} logueado={logueado} />

  return (
    <div className="flex flex-col gap-8">
      {posts.length > 0 && (
        <section>
          <SeccionHeader
            titulo="Publicaciones"
            total={plural(totalPosts, 'publicación', 'publicaciones')}
            mostrados={totalPosts > posts.length ? posts.length : undefined}
          />
          <div className="flex flex-col gap-4">
            {posts.map(p => <PostCard key={p.id} post={p} from="busqueda" />)}
          </div>
        </section>
      )}

      {users.length > 0 && (
        <section>
          <SeccionHeader
            titulo="Personas"
            total={plural(totalUsers, 'persona', 'personas')}
            mostrados={totalUsers > users.length ? users.length : undefined}
          />
          <div className="flex flex-col gap-3">
            {users.map(u => <PerfilCard key={u.id} u={u} />)}
          </div>
        </section>
      )}
    </div>
  )
}

// ── Descubrimiento (desktop, sin búsqueda ni filtros): Recientes | Populares ──
const COLUMNA_SIZE = 20

async function publicacionesRecientes(): Promise<SearchPost[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts').select(postSelect)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(COLUMNA_SIZE)
  return (data ?? []) as unknown as SearchPost[]
}

// "Popular" = interés recibido: solicitudes + conversaciones iniciadas sobre la publicación.
// No hay contador de visitas en la base. Los conteos se leen con service role (solo ids,
// nunca contenido de mensajes) porque la RLS no deja ver solicitudes/mensajes ajenos.
// Desempate por fecha, así la columna siempre se llena aunque haya poco uso.
async function publicacionesPopulares(): Promise<SearchPost[]> {
  const supabase = await createClient()
  const service  = createServiceClient()
  const [{ data: posts }, { data: apps }, { data: msgs }] = await Promise.all([
    supabase.from('posts').select(postSelect).eq('is_active', true).order('created_at', { ascending: false }).limit(200),
    service.from('applications').select('post_id'),
    service.from('messages').select('post_id, conversation_id').not('post_id', 'is', null),
  ])
  const interes = new Map<string, number>()
  for (const a of apps ?? []) interes.set(a.post_id, (interes.get(a.post_id) ?? 0) + 1)
  const convs = new Map<string, Set<string>>()
  for (const m of msgs ?? []) {
    if (!convs.has(m.post_id)) convs.set(m.post_id, new Set())
    convs.get(m.post_id)!.add(m.conversation_id)
  }
  for (const [postId, set] of convs) interes.set(postId, (interes.get(postId) ?? 0) + set.size)

  return ((posts ?? []) as unknown as SearchPost[])
    .map((p, orden) => ({ p, orden, puntos: interes.get(p.id) ?? 0 }))
    .sort((a, b) => b.puntos - a.puntos || a.orden - b.orden)
    .slice(0, COLUMNA_SIZE)
    .map(x => x.p)
}

function ColumnaDescubrimiento({ titulo, posts }: { titulo: string; posts: SearchPost[] }) {
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-label={titulo}>
      <h2 className="font-serif text-xl font-medium text-white">{titulo}</h2>
      {posts.length > 0
        ? posts.map(p => <PostCard key={p.id} post={p} from="busqueda" />)
        : <p className="text-sm text-zinc-500">Todavía no hay publicaciones.</p>}
    </section>
  )
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw    = await searchParams
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string') params.set(k, v)
  }

  const q        = (params.get('q') ?? '').trim().slice(0, 100)
  const filtros  = parseFiltros(params)
  const { tipo } = filtros
  const pagina   = Math.max(0, parseInt(params.get('pagina') ?? '0') || 0)
  // "!!!" no tiene palabras buscables → se trata como listado por defecto
  const isSearch = sanitizarTerminos(q).length > 0
  const hayFiltros = contarFiltrosActivos(filtros) > 0
  // Estado inicial: sin texto, sin filtros y sin pestaña elegida → en desktop, 2 columnas
  const descubrimiento = !isSearch && !hayFiltros && !params.get('tipo')
  const [recientes, populares] = descubrimiento
    ? await Promise.all([publicacionesRecientes(), publicacionesPopulares()])
    : [[], []]

  const user = await getAuthUser()

  let resultados: SearchResults | null = null
  let listado: SearchPost[] = []
  let listadoError: string | null = null
  const fetchLimit = (pagina + 1) * PAGE_SIZE

  if (isSearch) {
    resultados = await buscar(q, filtros)
  } else {
    // Sin texto: listado por fecha del tab seleccionado, con los filtros aplicados
    const supabase = await createClient()
    let query = supabase
      .from('posts')
      .select(postSelect)
      .eq('type', tipo)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(fetchLimit)
    if (filtros.categoria)        query = query.eq('category', filtros.categoria)
    if (filtros.modalidades)      query = query.overlaps('modality', filtros.modalidades)
    if (filtros.presencialidades) query = query.in('presencialidad', filtros.presencialidades)

    const { data, error } = await query
    if (error) {
      console.error('[buscar] error en listado', error)
      listadoError = 'No pudimos cargar las publicaciones. Probá de nuevo en unos segundos.'
    }
    listado = (data ?? []) as unknown as SearchPost[]
  }

  // "Ver más" conserva tipo y filtros
  const verMasParams = new URLSearchParams(params)
  verMasParams.set('pagina', String(pagina + 1))

  return (
    // En desktop el contenedor se ensancha solo para las columnas; buscador y resultados
    // mantienen el ancho de siempre (max-w-2xl centrado)
    <main className="mx-auto max-w-2xl px-4 py-8 lg:max-w-5xl">
      <SearchNavigationProvider>
        <div className="mx-auto max-w-2xl">
          <PageHeader title="Buscar" subtitle="Encontrá personas, servicios o trabajo" />
          <SearchForm />
          {/* En el estado inicial de desktop las columnas mezclan ambos tipos: las pestañas no aplican */}
          <div className={descubrimiento ? 'mt-4 lg:hidden' : 'mt-4'}>
            <SearchTabs />
          </div>
          <div className="mt-4">
            <SearchFilters />
          </div>
        </div>

        <div className="mt-6">
          <SearchPendingArea>
            {descubrimiento && (
              <div className="hidden items-start gap-6 lg:grid lg:grid-cols-2">
                <ColumnaDescubrimiento titulo="Publicaciones recientes" posts={recientes} />
                <ColumnaDescubrimiento titulo="Publicaciones populares" posts={populares} />
              </div>
            )}
            <div className={descubrimiento ? 'mx-auto max-w-2xl lg:hidden' : 'mx-auto max-w-2xl'}>
              {isSearch && resultados ? (
                resultados.error
                  ? <ErrorCard mensaje={resultados.error} />
                  : <ResultadosBusqueda q={q} resultados={resultados} logueado={!!user} />
              ) : listadoError ? (
                <ErrorCard mensaje={listadoError} />
              ) : listado.length > 0 ? (
                <>
                  <div className="flex flex-col gap-4">
                    {listado.map(p => <PostCard key={p.id} post={p} from="busqueda" />)}
                  </div>
                  {listado.length === fetchLimit && (
                    <Link
                      href={`/buscar?${verMasParams.toString()}`}
                      scroll={false}
                      className="mt-4 block rounded-xl border border-surface-2 py-3 text-center text-sm text-zinc-300 transition-colors hover:bg-surface-2 hover:text-white"
                    >
                      Ver más
                    </Link>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-surface-2 bg-surface-1 px-6 py-12 text-center">
                  {hayFiltros ? (
                    <>
                      <p className="font-medium text-white">No hay publicaciones con estos filtros.</p>
                      <p className="mt-1 text-sm text-zinc-400">Probá quitando alguno.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-white">
                        Todavía no hay {tipo === 'oferta' ? 'servicios publicados' : 'búsquedas de trabajo'}.
                      </p>
                      <p className="mt-1 text-sm text-zinc-400">¡Sé el primero en publicar!</p>
                      {user && (
                        <Link
                          href={`/publicar?tipo=${tipo}`}
                          className="mt-4 inline-block rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                        >
                          {tipo === 'oferta' ? 'Publicar mi servicio' : 'Publicar una búsqueda'}
                        </Link>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </SearchPendingArea>
        </div>
      </SearchNavigationProvider>
    </main>
  )
}
