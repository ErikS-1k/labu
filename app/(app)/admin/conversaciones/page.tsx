import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { avatarBg } from '@/lib/avatar'

const PAGE_SIZE = 20

type SearchParams = Promise<{ page?: string; periodo?: string }>

function fechaRelativa(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const horas = Math.floor(diff / 3600000)
  const dias  = Math.floor(diff / 86400000)
  if (mins < 60)  return `hace ${mins} min`
  if (horas < 24) return `hace ${horas}h`
  if (dias === 1) return 'ayer'
  if (dias < 7)   return `hace ${dias} días`
  return `hace ${Math.floor(dias / 7)} sem`
}

export default async function AdminConversacionesPage({ searchParams }: { searchParams: SearchParams }) {
  const { page = '1', periodo = 'todos' } = await searchParams
  const currentPage = Math.max(1, parseInt(page))
  const service     = createServiceClient()

  // Filtro por período
  let fechaDesde: string | null = null
  if (periodo === '24h') {
    const d = new Date(); d.setDate(d.getDate() - 1); fechaDesde = d.toISOString()
  } else if (periodo === 'semana') {
    const d = new Date(); d.setDate(d.getDate() - 7); fechaDesde = d.toISOString()
  }

  // Traer mensajes recientes para deduplicar por conversation_id
  let msgQuery = service
    .from('messages')
    .select('id, conversation_id, sender_id, receiver_id, post_id, created_at')
    .order('created_at', { ascending: false })
    .limit(600)

  if (fechaDesde) msgQuery = msgQuery.gte('created_at', fechaDesde)

  const { data: mensajes } = await msgQuery

  // Deduplicar: conservar solo el primer (más reciente) mensaje por conversation_id
  const vistosConvId = new Set<string>()
  const convRecientes: Array<{
    conversation_id: string
    sender_id: string
    receiver_id: string
    post_id: string | null
    created_at: string
  }> = []

  for (const m of mensajes ?? []) {
    if (!vistosConvId.has(m.conversation_id)) {
      vistosConvId.add(m.conversation_id)
      convRecientes.push(m as typeof convRecientes[0])
    }
  }

  const totalConvs = convRecientes.length
  const totalPaginas = Math.ceil(totalConvs / PAGE_SIZE)
  const pagina = convRecientes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Fetch usuarios y posts involucrados
  const userIds  = [...new Set(pagina.flatMap(c => [c.sender_id, c.receiver_id]))]
  const postIds  = [...new Set(pagina.map(c => c.post_id).filter(Boolean) as string[])]

  const [{ data: usuarios }, { data: posts }] = await Promise.all([
    userIds.length > 0
      ? service.from('users').select('id, username, first_name, avatar_url').in('id', userIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? service.from('posts').select('id, title').in('id', postIds)
      : Promise.resolve({ data: [] }),
  ])

  const usuariosMap = new Map((usuarios ?? []).map(u => [u.id, u]))
  const postsMap    = new Map((posts ?? []).map(p => [p.id, p]))

  // Contar mensajes por conversation_id para mostrar total
  const conteoPorConv: Record<string, number> = {}
  for (const m of mensajes ?? []) {
    conteoPorConv[m.conversation_id] = (conteoPorConv[m.conversation_id] ?? 0) + 1
  }

  const buildUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams({ page: currentPage.toString(), periodo, ...params })
    return `/admin/conversaciones?${p.toString()}`
  }

  const PERIODOS = [
    { value: 'todos',   label: 'Todas' },
    { value: '24h',     label: 'Últimas 24h' },
    { value: 'semana',  label: 'Última semana' },
  ]

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">← Admin</Link>
      <h1 className="mt-1 text-2xl font-bold text-white">Conversaciones</h1>
      <p className="text-sm text-zinc-500">{totalConvs} conversaciones activas detectadas</p>
      <p className="mt-1 text-xs text-zinc-600">Solo metadatos — el contenido de los mensajes no se muestra por privacidad.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PERIODOS.map(f => (
          <Link key={f.value} href={buildUrl({ periodo: f.value, page: '1' })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${periodo === f.value ? 'bg-blue-600 text-white' : 'border border-[#2a2a2a] text-zinc-400 hover:border-zinc-500'}`}>
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {pagina.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">Sin conversaciones en este período.</p>
        )}
        {pagina.map(conv => {
          const sender   = usuariosMap.get(conv.sender_id)
          const receiver = usuariosMap.get(conv.receiver_id)
          const post     = conv.post_id ? postsMap.get(conv.post_id) : null
          const conteo   = conteoPorConv[conv.conversation_id] ?? 1

          const renderUser = (u: typeof sender, fallbackId: string) => {
            if (!u) return <span className="text-sm text-zinc-500">Usuario</span>
            const nombre  = u.first_name || u.username || 'Usuario'
            const inicial = (u.first_name || u.username || 'U')[0].toUpperCase()
            return (
              <Link href={`/perfil/${fallbackId}`} className="flex items-center gap-1.5 hover:underline">
                {u.avatar_url
                  ? <Image src={u.avatar_url} width={24} height={24} className="rounded-full object-cover" alt="" />
                  : <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white ${avatarBg(u.username, u.first_name, fallbackId)}`}>{inicial}</span>
                }
                <span className="text-sm text-white">{nombre}</span>
              </Link>
            )
          }

          return (
            <div key={conv.conversation_id} className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {renderUser(sender, conv.sender_id)}
                  <span className="text-xs text-zinc-600">↔</span>
                  {renderUser(receiver, conv.receiver_id)}
                </div>
                <span className="shrink-0 text-xs text-zinc-600">{fechaRelativa(conv.created_at)}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                {post && (
                  <Link href={`/post/${conv.post_id}`} className="hover:text-zinc-300 line-clamp-1">
                    📄 {post.title}
                  </Link>
                )}
                <span className="text-zinc-700">·</span>
                <span>{conteo} mensaje{conteo !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )
        })}
      </div>

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
