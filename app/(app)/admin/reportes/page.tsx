import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { ESTADOS_REPORTE, TIPOS_REPORTE } from '@/lib/reportes'
import EstadoReporteSelect from '@/components/admin/EstadoReporteSelect'

// Protegida por proxy.ts (solo ADMIN_EMAIL). Lee con service role: ve los reportes de todos.

type SearchParams = Promise<{ tipo?: string; estado?: string }>

type Reporte = {
  id: string
  type: string
  description: string
  status: string
  created_at: string
  users: { id: string; first_name: string | null; last_name: string | null; username: string | null; email: string | null } | null
}

function fechaRelativa(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const horas = Math.floor(diff / 3600000)
  const dias  = Math.floor(diff / 86400000)
  if (mins < 2)   return 'ahora'
  if (mins < 60)  return `hace ${mins} min`
  if (horas < 24) return `hace ${horas}h`
  if (dias === 1) return 'ayer'
  if (dias < 7)   return `hace ${dias} días`
  if (dias < 30)  return `hace ${Math.floor(dias / 7)} sem`
  return `hace ${Math.floor(dias / 30)} meses`
}

const TIPO_ESTILO: Record<string, string> = {
  bug:        'bg-red-500/15 text-red-400',
  sugerencia: 'bg-violet-500/15 text-violet-400',
  otro:       'bg-zinc-500/15 text-zinc-300',
}
const ESTADO_ESTILO: Record<string, string> = {
  nuevo:       'bg-blue-500/15 text-blue-400',
  en_revision: 'bg-amber-500/15 text-amber-400',
  resuelto:    'bg-green-500/15 text-green-400',
}
const label = (lista: readonly { value: string; label: string }[], v: string) => lista.find(x => x.value === v)?.label ?? v

export default async function AdminReportesPage({ searchParams }: { searchParams: SearchParams }) {
  const { tipo = 'todos', estado = 'todos' } = await searchParams

  let query = createServiceClient()
    .from('reportes')
    .select('id, type, description, status, created_at, users(id, first_name, last_name, username, email)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (tipo !== 'todos')   query = query.eq('type', tipo)
  if (estado !== 'todos') query = query.eq('status', estado)

  const { data, error } = await query
  const reportes = (data ?? []) as unknown as Reporte[]
  const faltaTabla = !!error && /reportes/.test(error.message)

  function buildUrl(cambios: { tipo?: string; estado?: string }) {
    const p = new URLSearchParams()
    const t = cambios.tipo ?? tipo
    const e = cambios.estado ?? estado
    if (t !== 'todos') p.set('tipo', t)
    if (e !== 'todos') p.set('estado', e)
    const qs = p.toString()
    return `/admin/reportes${qs ? `?${qs}` : ''}`
  }

  const chip = (activo: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      activo ? 'bg-blue-600 text-white' : 'border border-[#2a2a2a] text-zinc-400 hover:border-zinc-500'
    }`

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">← Admin</Link>
      <h1 className="mt-1 text-2xl font-bold text-white">Reportes</h1>
      <p className="text-sm text-zinc-500">{reportes.length.toLocaleString('es-AR')} {reportes.length === 1 ? 'reporte' : 'reportes'}</p>

      {/* Filtros */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-14 text-xs text-zinc-600">Tipo</span>
          <Link href={buildUrl({ tipo: 'todos' })} className={chip(tipo === 'todos')}>Todos</Link>
          {TIPOS_REPORTE.map(t => (
            <Link key={t.value} href={buildUrl({ tipo: t.value })} className={chip(tipo === t.value)}>{t.label}</Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-14 text-xs text-zinc-600">Estado</span>
          <Link href={buildUrl({ estado: 'todos' })} className={chip(estado === 'todos')}>Todos</Link>
          {ESTADOS_REPORTE.map(e => (
            <Link key={e.value} href={buildUrl({ estado: e.value })} className={chip(estado === e.value)}>{e.label}</Link>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="mt-6 flex flex-col gap-3">
        {faltaTabla && (
          <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            La tabla <code>reportes</code> todavía no existe. Corré <code>supabase/reportes.sql</code> en el SQL Editor de Supabase.
          </p>
        )}
        {!faltaTabla && reportes.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">Sin reportes.</p>
        )}

        {reportes.map(r => {
          const u = r.users
          const nombre = [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.username || 'Usuario eliminado'
          return (
            <article key={r.id} className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TIPO_ESTILO[r.type] ?? TIPO_ESTILO.otro}`}>
                    {label(TIPOS_REPORTE, r.type)}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_ESTILO[r.status] ?? ''}`}>
                    {label(ESTADOS_REPORTE, r.status)}
                  </span>
                  <span className="text-xs text-zinc-500">{fechaRelativa(r.created_at)}</span>
                </div>
                <EstadoReporteSelect id={r.id} estado={r.status} />
              </div>

              <div className="mt-3 text-sm">
                {u?.id
                  ? <Link href={`/perfil/${u.id}`} className="font-medium text-white hover:underline">{nombre}</Link>
                  : <span className="font-medium text-zinc-400">{nombre}</span>}
                {u?.email && <span className="ml-2 text-zinc-500">{u.email}</span>}
              </div>

              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{r.description}</p>
            </article>
          )
        })}
      </div>
    </main>
  )
}
