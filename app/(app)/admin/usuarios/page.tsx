import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { avatarBg } from '@/lib/avatar'

const PAGE_SIZE = 20

type SearchParams = Promise<{ page?: string; filter?: string; q?: string }>

function fechaRelativa(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const dias = Math.floor(diff / 86400000)
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  if (dias < 30) return `hace ${Math.floor(dias / 7)} sem`
  if (dias < 365) return `hace ${Math.floor(dias / 30)} meses`
  return `hace ${Math.floor(dias / 365)} año${Math.floor(dias / 365) !== 1 ? 's' : ''}`
}

export default async function AdminUsuariosPage({ searchParams }: { searchParams: SearchParams }) {
  const { page = '1', filter = 'todos', q = '' } = await searchParams
  const currentPage = Math.max(1, parseInt(page))
  const offset      = (currentPage - 1) * PAGE_SIZE
  const service     = createServiceClient()

  let query = service
    .from('users')
    .select('id, username, first_name, last_name, email, avatar_url, created_at, verifications(status)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filter === 'verificados') {
    // Filtrar en JS — el join anidado no soporta eq directo
  }
  if (q.trim()) {
    query = query.or(`username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: usuarios, count } = await query.range(offset, offset + PAGE_SIZE - 1)

  // Aplicar filtro de verificación en JS
  let rows = (usuarios ?? []) as Array<{
    id: string
    username: string | null
    first_name: string | null
    last_name: string | null
    email: string | null
    avatar_url: string | null
    created_at: string
    verifications: { status: string }[] | null
  }>

  if (filter === 'verificados') {
    rows = rows.filter(u => (u.verifications as unknown as { status: string }[])?.some(v => v.status === 'verificado'))
  }
  if (filter === 'sinVerificar') {
    rows = rows.filter(u => !(u.verifications as unknown as { status: string }[])?.some(v => v.status === 'verificado'))
  }

  const totalPaginas = Math.ceil((count ?? 0) / PAGE_SIZE)

  const buildUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams({ page: currentPage.toString(), filter, q, ...params })
    return `/admin/usuarios?${p.toString()}`
  }

  const FILTROS = [
    { value: 'todos',       label: 'Todos' },
    { value: 'verificados', label: 'Identidad confirmada' },
    { value: 'sinVerificar', label: 'Sin confirmar' },
  ]

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">← Admin</Link>
      <h1 className="mt-1 text-2xl font-bold text-white">Usuarios</h1>
      <p className="text-sm text-zinc-500">{count?.toLocaleString('es-AR') ?? '–'} registrados en total</p>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTROS.map(f => (
          <Link
            key={f.value}
            href={buildUrl({ filter: f.value, page: '1' })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'border border-[#2a2a2a] text-zinc-400 hover:border-zinc-500'
            }`}
          >
            {f.label}
          </Link>
        ))}

        {/* Buscador */}
        <form method="get" action="/admin/usuarios" className="ml-auto">
          <input type="hidden" name="filter" value={filter} />
          <input type="hidden" name="page" value="1" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, username, email..."
            className="w-64 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
          />
        </form>
      </div>

      {/* Lista */}
      <div className="mt-5 flex flex-col gap-3">
        {rows.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">Sin resultados.</p>
        )}
        {rows.map(u => {
          const nombre      = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Sin nombre'
          const verificado  = (u.verifications as unknown as { status: string }[])?.some(v => v.status === 'verificado')
          const inicial     = (u.first_name || u.username || 'U')[0].toUpperCase()

          return (
            <div key={u.id} className="flex items-start gap-3 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4">
              {/* Avatar */}
              <div className="shrink-0">
                {u.avatar_url ? (
                  <Image src={u.avatar_url} width={40} height={40} className="rounded-full object-cover" alt="" />
                ) : (
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarBg(u.username, u.first_name, u.id)}`}>
                    {inicial}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/perfil/${u.id}`} className="font-medium text-white hover:underline">{nombre}</Link>
                  {u.username && <span className="text-sm text-zinc-500">@{u.username}</span>}
                  {verificado && (
                    <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">Identidad confirmada</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">{u.email ?? 'Sin email'}</p>
                <p className="mt-1 text-xs text-zinc-600">Registrado {fechaRelativa(u.created_at)}</p>
              </div>

              <div className="shrink-0 text-xs text-zinc-600">{u.id.slice(0, 8)}…</div>
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
