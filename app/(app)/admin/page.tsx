import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { avatarBg } from '@/lib/avatar'
import { obtenerMetricas, type Kpi, type PasoEmbudo, type Periodo } from '@/lib/admin-metricas'

function hace7dias() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString()
}

type HubCard = {
  href:     string
  titulo:   string
  desc:     string
  icono:    React.ReactNode
  color:    string
  valor:    number | null
  subtitulo?: string  // texto ya listo para mostrar bajo el número
}

function IconUsers() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function IconShield() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
}
function IconFileText() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
}
function IconSend() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
}
function IconMessages() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
function IconBell() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
}
function IconActivity() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}
function IconBarChart() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
}
function IconFlag() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
}
function IconHeart() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}

// ─── Dashboard: piezas ────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('es-AR')

// Variación semana actual vs anterior. Subir es bueno en todas las métricas de este dashboard.
function Variacion({ actual, anterior }: { actual: number; anterior: number }) {
  if (actual === 0 && anterior === 0) return <p className="text-xs text-zinc-500">Sin movimiento vs semana anterior</p>
  if (anterior === 0) return <p className="text-xs font-medium text-green-400">↑ Nuevo vs semana anterior</p>
  const pct = Math.round(((actual - anterior) / anterior) * 100)
  if (pct === 0) return <p className="text-xs text-zinc-500">= Igual que la semana anterior</p>
  const sube = pct > 0
  return (
    <p className={`text-xs font-medium ${sube ? 'text-green-400' : 'text-red-400'}`}>
      {sube ? '↑' : '↓'} {sube ? '+' : ''}{pct}% <span className="font-normal text-zinc-500">vs semana anterior</span>
    </p>
  )
}

function KpiCard({ k }: { k: Kpi }) {
  return (
    <div className={`flex flex-col gap-2 rounded-2xl border bg-[#171717] p-5 ${k.destacado ? 'border-blue-500/50' : 'border-[#2a2a2a]'}`}>
      <p className="flex items-center gap-2 text-sm text-zinc-400">
        {k.label}
        {k.destacado && <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Clave</span>}
      </p>
      <p className="text-4xl font-semibold leading-none text-white">{k.valor === null ? '—' : fmt(k.valor)}</p>
      {k.detalle && <p className="text-xs text-zinc-400">{k.detalle}</p>}
      <Variacion actual={k.actual} anterior={k.anterior} />
    </div>
  )
}

// Rampa ordinal azul → verde (un paso por etapa del embudo)
const RAMPA = ['bg-blue-500', 'bg-sky-500', 'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500']

function Embudo({ pasos }: { pasos: PasoEmbudo[] }) {
  const base = pasos[0]?.valor ?? 0
  if (base === 0) return <p className="py-6 text-center text-sm text-zinc-500">Sin registros en este período.</p>
  return (
    <ol className="flex flex-col">
      {pasos.map((paso, i) => {
        const ancho = Math.max((paso.valor / base) * 100, paso.valor > 0 ? 2 : 0)
        const siguiente = pasos[i + 1]
        return (
          <li key={paso.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-zinc-200">{paso.label}</span>
              <span className="text-sm font-semibold text-white">
                {fmt(paso.valor)} <span className="font-normal text-zinc-500">· {Math.round((paso.valor / base) * 100)}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
              <div className={`h-full rounded-full ${RAMPA[i % RAMPA.length]}`} style={{ width: `${ancho}%` }} />
            </div>
            {siguiente && (
              <p className="py-2 pl-1 text-xs text-zinc-500">
                ↓ {paso.valor > 0 ? `${Math.round((siguiente.valor / paso.valor) * 100)}% pasa al siguiente paso` : '—'}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Bloque({ titulo, extra, children }: { titulo: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-medium text-white">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  )
}

const PERIODOS: { valor: Periodo; label: string }[] = [
  { valor: '7', label: 'Últimos 7 días' },
  { valor: '30', label: 'Últimos 30 días' },
  { valor: 'todo', label: 'Todo el tiempo' },
]

export default async function AdminHubPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { periodo: periodoRaw } = await searchParams
  const periodo: Periodo = periodoRaw === '7' || periodoRaw === 'todo' ? periodoRaw : '30'
  const metricas = await obtenerMetricas()

  const service = createServiceClient()
  const hace7d  = hace7dias()

  const [
    { count: totalUsuarios },
    { count: verificPendientes },
    { count: postsActivos },
    { count: postulacionesSemana },
    { count: mensajes7d },
    { count: notifNoLeidas },
    { count: reportesNuevos },
  ] = await Promise.all([
    service.from('users').select('*', { count: 'exact', head: true }),
    service.from('verifications').select('*', { count: 'exact', head: true }).eq('status', 'pendiente'),
    service.from('posts').select('*', { count: 'exact', head: true }).eq('is_active', true),
    service.from('applications').select('*', { count: 'exact', head: true }).gte('created_at', hace7d),
    service.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', hace7d),
    service.from('notifications').select('*', { count: 'exact', head: true }).eq('read', false),
    service.from('reportes').select('*', { count: 'exact', head: true }).eq('status', 'nuevo'),
  ])

  const cards: HubCard[] = [
    {
      href:      '/admin/reportes',
      titulo:    'Reportes',
      desc:      'Bugs y sugerencias de usuarios',
      icono:     <IconFlag />,
      color:     'bg-red-500/15 text-red-400',
      valor:     reportesNuevos,
      subtitulo: reportesNuevos === 1 ? '1 nuevo' : `${reportesNuevos ?? 0} nuevos`,
    },
    {
      href:      '/admin/verificaciones',
      titulo:    'Identidades',
      desc:      'Revisar DNI pendientes',
      icono:     <IconShield />,
      color:     'bg-amber-500/15 text-amber-400',
      valor:     verificPendientes,
      subtitulo: verificPendientes === 1 ? '1 pendiente' : `${verificPendientes ?? 0} pendientes`,
    },
    {
      href:      '/admin/usuarios',
      titulo:    'Usuarios',
      desc:      'Todos los registrados',
      icono:     <IconUsers />,
      color:     'bg-blue-500/15 text-blue-400',
      valor:     totalUsuarios,
      subtitulo: `${totalUsuarios?.toLocaleString('es-AR') ?? 0} registrados`,
    },
    {
      href:      '/admin/publicaciones',
      titulo:    'Publicaciones',
      desc:      'Servicios y búsquedas',
      icono:     <IconFileText />,
      color:     'bg-green-500/15 text-green-400',
      valor:     postsActivos,
      subtitulo: postsActivos === 1 ? '1 visible' : `${postsActivos ?? 0} visibles`,
    },
    {
      href:      '/admin/postulaciones',
      titulo:    'Solicitudes',
      desc:      'Enviadas esta semana',
      icono:     <IconSend />,
      color:     'bg-violet-500/15 text-violet-400',
      valor:     postulacionesSemana,
      subtitulo: `${postulacionesSemana ?? 0} esta semana`,
    },
    {
      href:      '/admin/conversaciones',
      titulo:    'Conversaciones',
      desc:      'Mensajes últimos 7 días',
      icono:     <IconMessages />,
      color:     'bg-teal-500/15 text-teal-400',
      valor:     mensajes7d,
      subtitulo: mensajes7d === 1 ? '1 mensaje (7d)' : `${mensajes7d ?? 0} mensajes (7d)`,
    },
    {
      href:      '/admin/notificaciones',
      titulo:    'Notificaciones',
      desc:      'Sin leer en la plataforma',
      icono:     <IconBell />,
      color:     'bg-rose-500/15 text-rose-400',
      valor:     notifNoLeidas,
      subtitulo: `${notifNoLeidas ?? 0} sin leer`,
    },
    {
      href:   '/admin/actividad',
      titulo: 'Actividad',
      desc:   'Feed de eventos recientes',
      icono:  <IconActivity />,
      color:  'bg-orange-500/15 text-orange-400',
      valor:  null,
    },
    {
      href:   '/admin/metricas',
      titulo: 'Métricas',
      desc:   'Dashboard con gráficos',
      icono:  <IconBarChart />,
      color:  'bg-indigo-500/15 text-indigo-400',
      valor:  null,
    },
    {
      href:   '/admin/salud',
      titulo: 'Salud del sistema',
      desc:   'Estado de la base de datos',
      icono:  <IconHeart />,
      color:  'bg-pink-500/15 text-pink-400',
      valor:  null,
    },
  ]

  const { kpis, embudo, topPosts, topUsers, alertas } = metricas
  const actualizado = new Date(metricas.generado).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })

  const ALERTAS = [
    { clave: 'reportes', titulo: 'Reportes sin revisar', valor: alertas.reportes, href: '/admin/reportes', cta: 'Ver reportes',
      cls: 'border-orange-500/30 bg-orange-500/10', num: 'text-orange-400' },
    { clave: 'verif', titulo: 'Verificaciones pendientes', valor: alertas.verificaciones, href: '/admin/verificaciones', cta: 'Revisar',
      cls: 'border-blue-500/30 bg-blue-500/10', num: 'text-blue-400' },
    { clave: 'estancadas', titulo: 'Conversaciones estancadas', desc: 'Solicitudes aceptadas sin mensajes en 7 días', valor: alertas.estancadas,
      href: '/admin/postulaciones?status=aceptado', cta: 'Ver', cls: 'border-amber-500/30 bg-amber-500/10', num: 'text-amber-400' },
  ]

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-white">Admin</h1>
      <p className="mt-1 text-sm text-zinc-500">Estado del marketplace · datos cada 5 min (última actualización {actualizado})</p>

      {/* ── Bloque 1: KPIs ── */}
      <Bloque titulo="Marketplace">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map(k => <KpiCard key={k.clave} k={k} />)}
        </div>
      </Bloque>

      {/* ── Bloque 4 (va antes: es lo que pide acción): Alertas ── */}
      <Bloque titulo="Requiere atención">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ALERTAS.map(a => (
            <Link key={a.clave} href={a.href} className={`flex flex-col gap-2 rounded-2xl border p-5 transition-opacity hover:opacity-90 ${a.valor ? a.cls : 'border-[#2a2a2a] bg-[#171717]'}`}>
              <p className="text-sm text-zinc-300">{a.titulo}</p>
              <p className={`text-4xl font-semibold leading-none ${a.valor ? a.num : 'text-zinc-500'}`}>{a.valor === null ? '—' : fmt(a.valor)}</p>
              {a.desc && <p className="text-xs text-zinc-500">{a.desc}</p>}
              <span className="mt-1 text-sm font-medium text-blue-400">{a.cta} →</span>
            </Link>
          ))}
        </div>
      </Bloque>

      {/* ── Bloque 2: Embudo ── */}
      <Bloque
        titulo="Embudo de conversión"
        extra={
          <div className="flex gap-1 rounded-xl border border-[#2a2a2a] bg-[#111] p-1" role="group" aria-label="Período del embudo">
            {PERIODOS.map(p => (
              <Link key={p.valor} href={`/admin?periodo=${p.valor}`} scroll={false} aria-current={periodo === p.valor ? 'true' : undefined}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${periodo === p.valor ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
                {p.label}
              </Link>
            ))}
          </div>
        }
      >
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">
          <Embudo pasos={embudo[periodo]} />
          <p className="mt-4 border-t border-[#2a2a2a] pt-3 text-xs text-zinc-500">
            Usuarios registrados en el período y hasta dónde llegaron. Visitas a la landing: sin datos (no hay analytics).
            &ldquo;Primera acción&rdquo; = publicó, envió una solicitud o escribió un mensaje (las búsquedas no se registran).
          </p>
        </div>
      </Bloque>

      {/* ── Bloque 3: Top listas ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Bloque titulo="Publicaciones más populares">
          <div className="overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#171717]">
            {topPosts.length === 0 ? <p className="px-5 py-8 text-center text-sm text-zinc-500">Sin datos todavía.</p> : (
              <ol className="divide-y divide-[#2a2a2a]">
                {topPosts.map((p, i) => (
                  <li key={p.id}>
                    <Link href={`/post/${p.id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/5">
                      <span className="w-4 shrink-0 text-sm font-semibold text-zinc-500">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">{p.titulo}</span>
                        <span className="block text-xs text-zinc-500">{p.autor}</span>
                      </span>
                      <span className="shrink-0 text-right text-xs text-zinc-400">
                        {p.solicitudes} {p.solicitudes === 1 ? 'solicitud' : 'solicitudes'}<br />
                        {p.conversaciones} {p.conversaciones === 1 ? 'conversación' : 'conversaciones'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Bloque>

        <Bloque titulo="Usuarios más activos">
          <div className="overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#171717]">
            {topUsers.length === 0 ? <p className="px-5 py-8 text-center text-sm text-zinc-500">Sin datos todavía.</p> : (
              <ol className="divide-y divide-[#2a2a2a]">
                {topUsers.map(u => (
                  <li key={u.id}>
                    <Link href={`/perfil/${u.id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/5">
                      {u.avatar_url
                        ? <Image src={u.avatar_url} width={36} height={36} sizes="36px" alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                        : <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarBg(u.username, u.nombre, u.id)}`}>{u.nombre[0].toUpperCase()}</span>}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">{u.nombre}</span>
                        <span className="block truncate text-xs text-zinc-500">{u.email ?? 'sin email'}</span>
                      </span>
                      <span className="shrink-0 text-right text-xs text-zinc-400">
                        {u.publicaciones} publ. · {u.solicitudes} solic.<br />{u.mensajes} mensajes
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Bloque>
      </div>

      {/* ── Vistas detalladas (las de siempre) ── */}
      <h2 className="mt-12 font-serif text-xl font-medium text-white">Vistas detalladas</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex flex-col gap-3 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5 transition-colors hover:border-[#383838]"
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
                {c.icono}
              </div>
              {c.valor !== null && (
                <span className="rounded-full bg-[#252525] px-2.5 py-1 text-xs font-semibold text-white">
                  {c.valor.toLocaleString('es-AR')}
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">{c.titulo}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {c.subtitulo ?? c.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
