import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostCard, { PostCardData } from '@/components/posts/PostCard'
import SearchForm from '@/components/search/SearchForm'
import EmptyFeedState from '@/components/posts/EmptyFeedState'

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>
}) {
  const { q: rawQ = '', tab = 'todo' } = await searchParams
  const q = rawQ.trim().slice(0, 100)
  // Escapa caracteres especiales de PostgREST para evitar inyección en el filtro ilike
  const safe = q.replace(/['"\\,]/g, '')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  type PerfilRow = {
    id: string
    first_name: string | null
    username: string | null
    headline: string | null
    bio: string | null
    location: string | null
    avatar_url: string | null
    rating_avg: number | null
    rating_count: number | null
  }

  const [{ data: perfiles }, { data: ofertas }, { data: requerimientos }] = q
    ? await Promise.all([
        supabase
          .from('users')
          .select('id, first_name, username, headline, bio, location, avatar_url, rating_avg, rating_count')
          .or(`first_name.ilike.%${safe}%,username.ilike.%${safe}%,headline.ilike.%${safe}%,location.ilike.%${safe}%,bio.ilike.%${safe}%`)
          .limit(20),

        supabase
          .from('posts')
          .select('id, type, title, description, category, modality, price, price_type, location, created_at, users(username, rating_avg, avatar_url)')
          .eq('type', 'oferta')
          .eq('is_active', true)
          .or(`title.ilike.%${safe}%,description.ilike.%${safe}%,category.ilike.%${safe}%,location.ilike.%${safe}%`)
          .order('created_at', { ascending: false })
          .limit(20),

        supabase
          .from('posts')
          .select('id, type, title, description, category, modality, price, price_type, location, created_at, users(username, rating_avg, avatar_url)')
          .eq('type', 'requerimiento')
          .eq('is_active', true)
          .or(`title.ilike.%${safe}%,description.ilike.%${safe}%,category.ilike.%${safe}%,location.ilike.%${safe}%`)
          .order('created_at', { ascending: false })
          .limit(20),
      ])
    : [
        { data: [] as PerfilRow[] },
        { data: [] as PostCardData[] },
        { data: [] as PostCardData[] },
      ]

  const nPerfiles       = perfiles?.length ?? 0
  const nOfertas        = ofertas?.length ?? 0
  const nRequerimientos = requerimientos?.length ?? 0
  const nTotal          = nPerfiles + nOfertas + nRequerimientos

  const TABS = [
    { key: 'todo',           label: 'Todo',           count: nTotal },
    { key: 'perfiles',       label: 'Perfiles',       count: nPerfiles },
    { key: 'ofertas',        label: 'Servicios',      count: nOfertas },
    { key: 'requerimientos', label: 'Búsquedas',      count: nRequerimientos },
  ]

  const mostrarPerfiles       = tab === 'todo' || tab === 'perfiles'
  const mostrarOfertas        = tab === 'todo' || tab === 'ofertas'
  const mostrarRequerimientos = tab === 'todo' || tab === 'requerimientos'

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <SearchForm initialQ={q} />

      {/* Tabs — solo cuando hay búsqueda activa */}
      {q && (
        <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-surface-2 bg-surface-1 p-1">
          {TABS.map(t => (
            <Link
              key={t.key}
              href={`/buscar?q=${encodeURIComponent(q)}&tab=${t.key}`}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-surface-3 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.label}
              <span className={`ml-1 text-xs ${tab === t.key ? 'text-zinc-400' : 'text-zinc-300'}`}>
                {t.count}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Sin búsqueda — estado vacío con accesos rápidos */}
      {!q && (
        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-400">
            Buscá personas, servicios o trabajo en Labu.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/ofertas"
              className="rounded-lg border border-surface-2 bg-surface-1 px-4 py-2.5 text-sm text-zinc-200 transition-colors hover:bg-surface-2"
            >
              Ver Servicios
            </Link>
            <Link
              href="/requerimientos"
              className="rounded-lg border border-surface-2 bg-surface-1 px-4 py-2.5 text-sm text-zinc-200 transition-colors hover:bg-surface-2"
            >
              Ver Búsquedas
            </Link>
          </div>
        </div>
      )}

      {/* Sin resultados totales */}
      {q && nTotal === 0 && (
        <div className="mt-6">
          <EmptyFeedState busqueda={q} isLoggedIn={!!user} hayFiltros={true} />
        </div>
      )}

      {/* Resultados */}
      {q && nTotal > 0 && (
        <div className="mt-6 flex flex-col gap-8">

          {/* Perfiles */}
          {mostrarPerfiles && nPerfiles > 0 && (
            <section>
              {tab === 'todo' && (
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Perfiles
                </h2>
              )}
              <div className="flex flex-col gap-4">
                {(perfiles as PerfilRow[]).map(u => {
                  const nombre  = u.first_name ?? u.username ?? 'Usuario'
                  const inicial = nombre[0].toUpperCase()
                  return (
                    <Link
                      key={u.id}
                      href={`/perfil/${u.id}`}
                      className="flex items-start gap-4 rounded-xl border border-zinc-700 bg-surface-1 p-5 transition-colors hover:bg-surface-2"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-2">
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt={nombre} className="h-full w-full object-cover" />
                          : <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-zinc-300">{inicial}</span>
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-base font-semibold text-white">{nombre}</p>
                          {(u.rating_count ?? 0) > 0 && (
                            <span className="shrink-0 text-xs text-zinc-300">★ {u.rating_avg}</span>
                          )}
                        </div>
                        {u.headline && (
                          <p className="text-sm font-medium text-zinc-300">{u.headline}</p>
                        )}
                        {u.location && (
                          <p className="mt-0.5 text-sm text-zinc-400">{u.location}</p>
                        )}
                        {u.bio && (
                          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-zinc-300">
                            {u.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Ofertas */}
          {mostrarOfertas && nOfertas > 0 && (
            <section>
              {tab === 'todo' && (
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Servicios
                </h2>
              )}
              <div className="flex flex-col gap-4">
                {(ofertas as PostCardData[]).map(post => (
                  <PostCard key={post.id} post={post} from="busqueda" />
                ))}
              </div>
            </section>
          )}

          {/* Requerimientos */}
          {mostrarRequerimientos && nRequerimientos > 0 && (
            <section>
              {tab === 'todo' && (
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Búsquedas
                </h2>
              )}
              <div className="flex flex-col gap-4">
                {(requerimientos as PostCardData[]).map(post => (
                  <PostCard key={post.id} post={post} from="busqueda" />
                ))}
              </div>
            </section>
          )}

          {/* Tab activo sin resultados */}
          {tab === 'perfiles' && nPerfiles === 0 && (
            <p className="text-center text-sm text-zinc-400">
              Sin perfiles para &ldquo;{q}&rdquo;.
            </p>
          )}
          {tab === 'ofertas' && nOfertas === 0 && (
            <EmptyFeedState busqueda={q} tipo="oferta" isLoggedIn={!!user} hayFiltros={true} />
          )}
          {tab === 'requerimientos' && nRequerimientos === 0 && (
            <EmptyFeedState busqueda={q} tipo="requerimiento" isLoggedIn={!!user} hayFiltros={true} />
          )}

          {/* Tab "Todo" con resultados parciales: empty state del lado vacío */}
          {tab === 'todo' && (nOfertas + nRequerimientos) > 0 && (
            <>
              {nOfertas === 0 && (
                <EmptyFeedState busqueda={q} tipo="oferta" isLoggedIn={!!user} hayFiltros={true} />
              )}
              {nRequerimientos === 0 && (
                <EmptyFeedState busqueda={q} tipo="requerimiento" isLoggedIn={!!user} hayFiltros={true} />
              )}
            </>
          )}

        </div>
      )}
    </main>
  )
}
