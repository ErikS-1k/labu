import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { avatarBg } from '@/lib/avatar'
import PostCard, { type PostCardData } from '@/components/posts/PostCard'
import SearchForm from '@/components/search/SearchForm'
import PageHeader from '@/components/ui/PageHeader'

const postSelect = 'id, user_id, type, title, description, category, modality, presencialidad, temporal_duration, price, price_type, location, created_at, users(username, first_name, fecha_nacimiento, rating_avg, avatar_url)'

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; pagina?: string }>
}) {
  const params  = await searchParams
  const q       = (params.q ?? '').trim().slice(0, 100)
  const safe    = q.replace(/['"\\,]/g, '')
  const tipo    = params.tipo === 'requerimiento' ? 'requerimiento' : 'oferta'
  const pagina  = Math.max(0, parseInt(params.pagina ?? '0') || 0)
  const isSearch = !!q
  const PAGE_SIZE  = 20
  const fetchLimit = isSearch ? PAGE_SIZE : (pagina + 1) * PAGE_SIZE

  const supabase = await createClient()
  const user = await getAuthUser()

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

  // Perfiles — solo cuando hay búsqueda activa
  const perfiles: PerfilRow[] = isSearch
    ? ((await supabase
        .from('users')
        .select('id, first_name, username, headline, bio, location, avatar_url, rating_avg, rating_count')
        .or(`first_name.ilike.%${safe}%,username.ilike.%${safe}%,headline.ilike.%${safe}%,location.ilike.%${safe}%,bio.ilike.%${safe}%`)
        .limit(10)).data ?? []) as PerfilRow[]
    : []

  // Posts del tipo seleccionado, filtrados por búsqueda si la hay
  let postQuery = supabase
    .from('posts')
    .select(postSelect)
    .eq('type', tipo)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(fetchLimit)

  if (safe) {
    postQuery = postQuery.or(`title.ilike.%${safe}%,description.ilike.%${safe}%,category.ilike.%${safe}%,location.ilike.%${safe}%`)
  }

  const { data: postsRaw } = await postQuery
  const posts = (postsRaw ?? []) as unknown as PostCardData[]

  // URL de cada tab preservando q si existe
  function tipoUrl(t: string) {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    p.set('tipo', t)
    return `/buscar?${p.toString()}`
  }

  const tabCls = (active: boolean) =>
    `flex-1 rounded-lg py-2 text-sm font-medium text-center transition-colors ${
      active
        ? 'bg-blue-500 text-white'
        : 'border border-surface-2 text-zinc-400 hover:bg-surface-2 hover:text-zinc-200'
    }`

  const showPostsHeader = isSearch && perfiles.length > 0 && posts.length > 0

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader title="Buscar" subtitle="Encontrá personas, servicios o trabajo" />
      <SearchForm initialQ={q} />

      {/* Selector de tipo */}
      <div className="mt-4 flex gap-2">
        <Link href={tipoUrl('oferta')} className={tabCls(tipo === 'oferta')}>
          Servicios ofrecidos
        </Link>
        <Link href={tipoUrl('requerimiento')} className={tabCls(tipo === 'requerimiento')}>
          Búsquedas de trabajo
        </Link>
      </div>

      {/* Perfiles — solo en búsqueda activa */}
      {isSearch && perfiles.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Perfiles
          </h2>
          <div className="flex flex-col gap-3">
            {perfiles.map(u => {
              const nombre  = u.first_name ?? u.username ?? 'Usuario'
              const inicial = nombre[0].toUpperCase()
              return (
                <Link
                  key={u.id}
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
            })}
          </div>
        </section>
      )}

      {/* Posts */}
      <section className="mt-6">
        {showPostsHeader && (
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {tipo === 'oferta' ? 'Servicios' : 'Búsquedas de trabajo'}
          </h2>
        )}

        {posts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {posts.map(p => (
              <PostCard key={p.id} post={p} from="busqueda" />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-surface-2 bg-surface-1 px-6 py-12 text-center">
            {isSearch ? (
              <>
                <p className="font-medium text-white">Sin resultados</p>
                <p className="mt-1 text-sm text-zinc-400">
                  No encontramos publicaciones que coincidan con tu búsqueda.
                </p>
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

        {/* Ver más — solo en modo browse cuando hay más resultados */}
        {!isSearch && posts.length === fetchLimit && (
          <Link
            href={`/buscar?tipo=${tipo}&pagina=${pagina + 1}`}
            className="mt-4 block rounded-xl border border-surface-2 py-3 text-center text-sm text-zinc-300 transition-colors hover:bg-surface-2 hover:text-white"
          >
            Ver más
          </Link>
        )}
      </section>
    </main>
  )
}
