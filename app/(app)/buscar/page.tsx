import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
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
import PostCard from '@/components/posts/PostCard'
import SearchForm from '@/components/search/SearchForm'
import SearchTabs from '@/components/search/SearchTabs'
import SearchFilters from '@/components/search/SearchFilters'
import CategoriaSugerencias from '@/components/search/CategoriaSugerencias'
import PublicarBusquedaCTA from '@/components/search/PublicarBusquedaCTA'
import { SearchNavigationProvider, SearchPendingArea } from '@/components/search/SearchNavigation'
import PageHeader from '@/components/ui/PageHeader'

// Listado por defecto (sin texto buscado). Sin fecha_nacimiento: PostCard no la usa.
const postSelect = 'id, user_id, type, title, description, category, modality, presencialidad, temporal_duration, price, price_type, location, created_at, users(username, first_name, rating_avg, avatar_url)'
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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader title="Buscar" subtitle="Encontrá personas, servicios o trabajo" />

      <SearchNavigationProvider>
        <SearchForm />
        <div className="mt-4">
          <SearchTabs />
        </div>
        <div className="mt-4">
          <SearchFilters />
        </div>

        <div className="mt-6">
          <SearchPendingArea>
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
          </SearchPendingArea>
        </div>
      </SearchNavigationProvider>
    </main>
  )
}
