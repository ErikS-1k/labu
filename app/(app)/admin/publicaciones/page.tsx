import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { avatarBg } from '@/lib/avatar'
import { PRICE_TYPES } from '@/lib/constants'

const PAGE_SIZE = 20

type SearchParams = Promise<{ page?: string; type?: string; activo?: string; q?: string }>

function fechaRelativa(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const dias = Math.floor(diff / 86400000)
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  return `hace ${Math.floor(dias / 7)} sem`
}

export default async function AdminPublicacionesPage({ searchParams }: { searchParams: SearchParams }) {
  const { page = '1', type = 'todos', activo = 'todos', q = '' } = await searchParams
  const currentPage = Math.max(1, parseInt(page))
  const offset      = (currentPage - 1) * PAGE_SIZE
  const service     = createServiceClient()

  let query = service
    .from('posts')
    .select(
      'id, user_id, type, title, category, is_active, price, price_type, modality, presencialidad, location, created_at, users(id, username, first_name, avatar_url, rating_avg)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (type === 'oferta')         query = query.eq('type', 'oferta')
  if (type === 'requerimiento')  query = query.eq('type', 'requerimiento')
  if (activo === 'activas')      query = query.eq('is_active', true)
  if (activo === 'desactivadas') query = query.eq('is_active', false)
  if (q.trim())                  query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)

  const { data: posts, count } = await query.range(offset, offset + PAGE_SIZE - 1)

  const totalPaginas = Math.ceil((count ?? 0) / PAGE_SIZE)

  const buildUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams({ page: currentPage.toString(), type, activo, q, ...params })
    return `/admin/publicaciones?${p.toString()}`
  }

  const TIPOS_FILTRO   = [{ value: 'todos', label: 'Todos' }, { value: 'oferta', label: 'Servicios' }, { value: 'requerimiento', label: 'Búsquedas' }]
  const ESTADO_FILTRO  = [{ value: 'todos', label: 'Todas' }, { value: 'activas', label: 'Activas' }, { value: 'desactivadas', label: 'Desactivadas' }]

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">← Admin</Link>
      <h1 className="mt-1 text-2xl font-bold text-white">Publicaciones</h1>
      <p className="text-sm text-zinc-500">{count?.toLocaleString('es-AR') ?? '–'} publicaciones</p>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TIPOS_FILTRO.map(f => (
          <Link key={f.value} href={buildUrl({ type: f.value, page: '1' })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${type === f.value ? 'bg-blue-600 text-white' : 'border border-[#2a2a2a] text-zinc-400 hover:border-zinc-500'}`}>
            {f.label}
          </Link>
        ))}
        <span className="text-zinc-700">|</span>
        {ESTADO_FILTRO.map(f => (
          <Link key={f.value} href={buildUrl({ activo: f.value, page: '1' })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${activo === f.value ? 'bg-blue-600 text-white' : 'border border-[#2a2a2a] text-zinc-400 hover:border-zinc-500'}`}>
            {f.label}
          </Link>
        ))}
        <form method="get" action="/admin/publicaciones" className="ml-auto flex items-center">
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="activo" value={activo} />
          <input type="hidden" name="page" value="1" />
          <input name="q" defaultValue={q} placeholder="Buscar por título..."
            className="w-56 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500" />
        </form>
      </div>

      {/* Lista */}
      <div className="mt-5 flex flex-col gap-3">
        {(posts ?? []).length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">Sin resultados.</p>
        )}
        {(posts ?? []).map(p => {
          const autor = p.users as unknown as { id: string; username: string | null; first_name: string | null; avatar_url: string | null; rating_avg: number | null } | null
          const nombreAutor = autor?.first_name || autor?.username || 'Usuario'
          const inicialAutor = (autor?.first_name || autor?.username || 'U')[0].toUpperCase()
          const priceLabel = p.price
            ? `$${Number(p.price).toLocaleString('es-AR')} ${PRICE_TYPES.find(t => t.value === p.price_type)?.label ?? ''}`
            : 'A convenir'

          return (
            <div key={p.id} className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.type === 'oferta' ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-400'}`}>
                      {p.type === 'oferta' ? 'Ofrece' : 'Busca'}
                    </span>
                    {!p.is_active && (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">Desactivada</span>
                    )}
                    {p.category && <span className="text-xs text-zinc-500">{p.category}</span>}
                  </div>
                  <Link href={`/post/${p.id}`} className="mt-1.5 block font-semibold text-white hover:underline line-clamp-1">
                    {p.title}
                  </Link>
                </div>
                <span className="shrink-0 text-sm font-medium text-zinc-300">{priceLabel}</span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <Link href={`/perfil/${p.user_id}`} className="flex items-center gap-2 hover:underline">
                  {autor?.avatar_url ? (
                    <Image src={autor.avatar_url} width={24} height={24} className="rounded-full object-cover" alt="" />
                  ) : (
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white ${avatarBg(autor?.username, autor?.first_name, p.user_id)}`}>
                      {inicialAutor}
                    </span>
                  )}
                  <span className="text-sm text-zinc-400">{nombreAutor}</span>
                </Link>
                <span className="text-xs text-zinc-600">{fechaRelativa(p.created_at)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-between">
          {currentPage > 1
            ? <Link href={buildUrl({ page: String(currentPage - 1) })} className="rounded-xl border border-[#2a2a2a] px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500">← Anterior</Link>
            : <span />}
          <span className="text-xs text-zinc-600">Pág {currentPage} de {totalPaginas}</span>
          {currentPage < totalPaginas
            ? <Link href={buildUrl({ page: String(currentPage + 1) })} className="rounded-xl border border-[#2a2a2a] px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500">Siguiente →</Link>
            : <span />}
        </div>
      )}
    </main>
  )
}
