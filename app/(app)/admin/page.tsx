import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'

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
function IconHeart() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}

export default async function AdminHubPage() {
  const service = createServiceClient()
  const hace7d  = hace7dias()

  const [
    { count: totalUsuarios },
    { count: verificPendientes },
    { count: postsActivos },
    { count: postulacionesSemana },
    { count: mensajes7d },
    { count: notifNoLeidas },
  ] = await Promise.all([
    service.from('users').select('*', { count: 'exact', head: true }),
    service.from('verifications').select('*', { count: 'exact', head: true }).eq('status', 'pendiente'),
    service.from('posts').select('*', { count: 'exact', head: true }).eq('is_active', true),
    service.from('applications').select('*', { count: 'exact', head: true }).gte('created_at', hace7d),
    service.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', hace7d),
    service.from('notifications').select('*', { count: 'exact', head: true }).eq('read', false),
  ])

  const cards: HubCard[] = [
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-white">Admin</h1>
      <p className="mt-1 text-sm text-zinc-500">Panel de control de Labu — solo visible para vos</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
