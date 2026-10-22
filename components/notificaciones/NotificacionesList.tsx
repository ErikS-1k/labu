'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { marcarTodasLeidas } from '@/app/actions/notifications'

type Notificacion = {
  id: string
  type: string
  message: string
  link: string
  read: boolean
  created_at: string
  user_id: string
}

type GroupedNotif = {
  key: string
  ids: string[]
  type: string
  message: string
  link: string
  read: boolean
  created_at: string
  count: number
}

// ─── Íconos ──────────────────────────────────────────────────────────────────

function IconMessage() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function IconUserPlus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  )
}

function IconSend() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function IconStar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

function IconCheckCircle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

function IconBell() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

// ─── Config por tipo ──────────────────────────────────────────────────────────

type TypeConfig = {
  icon: () => React.JSX.Element
  bg: string
  color: string
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  nuevo_mensaje:             { icon: IconMessage,     bg: 'bg-blue-500/15',   color: 'text-blue-400' },
  nueva_postulacion:         { icon: IconUserPlus,    bg: 'bg-green-500/15',  color: 'text-green-400' },
  postulacion_enviada:       { icon: IconSend,        bg: 'bg-blue-500/15',   color: 'text-blue-400' },
  postulacion_aceptada:      { icon: IconCheck,       bg: 'bg-green-500/15',  color: 'text-green-400' },
  postulacion_rechazada:     { icon: IconX,           bg: 'bg-orange-500/15', color: 'text-orange-400' },
  trabajo_completado:        { icon: IconCheckCircle, bg: 'bg-green-500/15',  color: 'text-green-400' },
  nuevo_rating:              { icon: IconStar,        bg: 'bg-yellow-500/15', color: 'text-yellow-400' },
  verificacion_aprobada:     { icon: IconCheck,       bg: 'bg-green-500/15',  color: 'text-green-400' },
  verificacion_rechazada:    { icon: IconX,           bg: 'bg-orange-500/15', color: 'text-orange-400' },
  recordatorio_calificacion: { icon: IconBell,        bg: 'bg-orange-500/15', color: 'text-orange-400' },
}

const FALLBACK_CONFIG: TypeConfig = { icon: IconBell, bg: 'bg-surface-2', color: 'text-zinc-400' }

// ─── Agrupación ───────────────────────────────────────────────────────────────

function groupNotifications(notifs: Notificacion[]): GroupedNotif[] {
  const map = new Map<string, GroupedNotif>()

  for (const n of notifs) {
    const dayKey = new Date(n.created_at).toDateString()
    const key = `${n.type}::${n.link}::${dayKey}`

    if (map.has(key)) {
      const g = map.get(key)!
      g.ids.push(n.id)
      g.count++
      if (!n.read) g.read = false
      if (new Date(n.created_at) > new Date(g.created_at)) {
        g.created_at = n.created_at
        g.message    = n.message
      }
    } else {
      map.set(key, {
        key,
        ids:        [n.id],
        type:       n.type,
        message:    n.message,
        link:       n.link,
        read:       n.read,
        created_at: n.created_at,
        count:      1,
      })
    }
  }

  return Array.from(map.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// ─── Tiempo ───────────────────────────────────────────────────────────────────

function formatTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)  return 'ahora'
  if (min < 60) return `hace ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24)   return `hace ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1)  return 'ayer'
  if (d < 7)    return `hace ${d} días`
  return new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function getSectionKey(ts: string): 'hoy' | 'semana' | 'antigua' {
  const now        = new Date()
  const date       = new Date(ts)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart  = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000)
  if (date >= todayStart) return 'hoy'
  if (date >= weekStart)  return 'semana'
  return 'antigua'
}

const SECTION_LABELS: Record<string, string> = {
  hoy:     'Hoy',
  semana:  'Esta semana',
  antigua: 'Más antiguas',
}

// ─── Componente principal ─────────────────────────────────────────────────────

type Props = {
  initialNotifs: Notificacion[]
  userId: string
  initialUnread: number
}

export default function NotificacionesList({ initialNotifs, userId, initialUnread }: Props) {
  const [notifs, setNotifs] = useState(initialNotifs)

  // Marcar leídas con delay estilo Instagram
  useEffect(() => {
    if (initialUnread === 0) return
    const timer = setTimeout(() => {
      marcarTodasLeidas()
      setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    }, 1500)
    return () => clearTimeout(timer)
  }, [initialUnread])

  // Realtime — nuevas notificaciones mientras la página está abierta
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | undefined
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)

      channel = supabase
        .channel(`notif-page-${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
          const nueva = payload.new as Notificacion
          if (nueva.user_id !== userId) return
          setNotifs(prev => [{ ...nueva, read: false }, ...prev])
        })
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [userId])

  // ── Estado vacío ─────────────────────────────────────────────────────────────
  if (notifs.length === 0) {
    return (
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#171717] px-6 py-16 text-center">
        <p className="text-4xl">🔔</p>
        <p className="mt-3 text-sm font-medium text-zinc-300">Todo tranquilo por acá</p>
        <p className="mt-1 text-xs text-zinc-500">
          Cuando alguien te contacte, te deje una opinión o te mande un mensaje, te avisamos acá.
        </p>
      </div>
    )
  }

  // ── Agrupar y seccionar ───────────────────────────────────────────────────────
  const grouped = groupNotifications(notifs)

  const sectionOrder: Array<'hoy' | 'semana' | 'antigua'> = ['hoy', 'semana', 'antigua']
  const sections = sectionOrder
    .map(key => ({ key, label: SECTION_LABELS[key], items: grouped.filter(g => getSectionKey(g.created_at) === key) }))
    .filter(s => s.items.length > 0)

  return (
    <div className="flex flex-col gap-6">
      {sections.map(section => (
        <div key={section.key}>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {section.label}
          </p>

          <div className="flex flex-col gap-2">
            {section.items.map(g => {
              const config = TYPE_CONFIG[g.type] ?? FALLBACK_CONFIG
              const Icon   = config.icon

              return (
                <Link
                  key={g.key}
                  href={g.link}
                  className="flex items-start gap-3 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4 transition-colors hover:border-[#383838] hover:bg-[#1e1e1e]"
                >
                  {/* Ícono de tipo */}
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${config.bg} ${config.color}`}>
                    <Icon />
                  </div>

                  {/* Contenido */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-snug ${g.read ? 'text-zinc-400' : 'text-zinc-100'}`}>
                      {g.message}
                    </p>

                    {g.count > 1 && (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        y {g.count - 1} {g.count === 2 ? 'notificación más' : 'notificaciones más'} del mismo tipo
                      </p>
                    )}

                    <p className="mt-1 text-xs text-zinc-500">{formatTime(g.created_at)}</p>
                  </div>

                  {/* Punto azul si no leída */}
                  <div className="mt-2 shrink-0">
                    {!g.read && <span className="block h-2 w-2 rounded-full bg-blue-500" />}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
