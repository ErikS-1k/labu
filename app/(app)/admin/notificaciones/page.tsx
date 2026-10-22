import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { avatarBg } from '@/lib/avatar'

const PAGE_SIZE = 30

type SearchParams = Promise<{ page?: string; tipo?: string; leida?: string }>

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

const TIPO_LABEL: Record<string, string> = {
  nueva_postulacion:      '📩 Nueva solicitud',
  postulacion_aceptada:   '✅ Solicitud aceptada',
  postulacion_rechazada:  '❌ Solicitud rechazada',
  trabajo_completado:     '🏁 Trabajo terminado',
  recordatorio_calificacion: '⭐ Calificar trabajo',
  verificacion_aprobada:  '🔵 Identidad confirmada',
  verificacion_rechazada: '🔴 Identidad no confirmada',
}

const TIPOS_DISPONIBLES = [
  'nueva_postulacion',
  'postulacion_aceptada',
  'postulacion_rechazada',
  'trabajo_completado',
  'recordatorio_calificacion',
  'verificacion_aprobada',
  'verificacion_rechazada',
]

export default async function AdminNotificacionesPage({ searchParams }: { searchParams: SearchParams }) {
  const { page = '1', tipo = 'todos', leida = 'todos' } = await searchParams
  const currentPage = Math.max(1, parseInt(page))
  const offset      = (currentPage - 1) * PAGE_SIZE
  const service     = createServiceClient()

  let query = service
    .from('notifications')
    .select(
      'id, user_id, type, message, link, read, created_at, users(id, username, first_name, avatar_url)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (tipo !== 'todos') query = query.eq('type', tipo)
  if (leida === 'leidas')   query = query.eq('read', true)
  if (leida === 'noLeidas') query = query.eq('read', false)

  const { data, count } = await query.range(offset, offset + PAGE_SIZE - 1)

  const totalPaginas = Math.ceil((count ?? 0) / PAGE_SIZE)

  const buildUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams({ page: currentPage.toString(), tipo, leida, ...params })
    return `/admin/notificaciones?${p.toString()}`
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">← Admin</Link>
      <h1 className="mt-1 text-2xl font-bold text-white">Notificaciones</h1>
      <p className="text-sm text-zinc-500">{count?.toLocaleString('es-AR') ?? '–'} en total</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {/* Filtro por lectura */}
        {[{ value: 'todos', label: 'Todas' }, { value: 'noLeidas', label: 'No leídas' }, { value: 'leidas', label: 'Leídas' }].map(f => (
          <Link key={f.value} href={buildUrl({ leida: f.value, page: '1' })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${leida === f.value ? 'bg-blue-600 text-white' : 'border border-[#2a2a2a] text-zinc-400 hover:border-zinc-500'}`}>
            {f.label}
          </Link>
        ))}
        <span className="text-zinc-700">|</span>
        {/* Filtro por tipo */}
        <Link href={buildUrl({ tipo: 'todos', page: '1' })}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${tipo === 'todos' ? 'bg-blue-600 text-white' : 'border border-[#2a2a2a] text-zinc-400 hover:border-zinc-500'}`}>
          Todos los tipos
        </Link>
        {TIPOS_DISPONIBLES.map(t => (
          <Link key={t} href={buildUrl({ tipo: t, page: '1' })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${tipo === t ? 'bg-blue-600 text-white' : 'border border-[#2a2a2a] text-zinc-400 hover:border-zinc-500'}`}>
            {TIPO_LABEL[t] ?? t}
          </Link>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {(data ?? []).length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">Sin resultados.</p>
        )}
        {(data ?? []).map(n => {
          const user    = n.users as unknown as { id: string; username: string | null; first_name: string | null; avatar_url: string | null } | null
          const nombre  = user?.first_name || user?.username || 'Usuario'
          const inicial = (user?.first_name || user?.username || 'U')[0].toUpperCase()

          return (
            <div key={n.id} className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${n.read ? 'border-[#222] bg-[#141414]' : 'border-[#2a2a2a] bg-[#171717]'}`}>
              {/* Avatar del destinatario */}
              <Link href={`/perfil/${n.user_id}`} className="shrink-0">
                {user?.avatar_url ? (
                  <Image src={user.avatar_url} width={32} height={32} className="rounded-full object-cover" alt="" />
                ) : (
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarBg(user?.username, user?.first_name, n.user_id)}`}>
                    {inicial}
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/perfil/${n.user_id}`} className="text-sm font-medium text-white hover:underline">{nombre}</Link>
                    <span className="text-xs text-zinc-500">{TIPO_LABEL[n.type] ?? n.type}</span>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                  </div>
                  <span className="shrink-0 text-xs text-zinc-600">{fechaRelativa(n.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-400">{n.message}</p>
                {n.link && (
                  <Link href={n.link} className="mt-1 text-xs text-blue-400 hover:underline">{n.link}</Link>
                )}
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
