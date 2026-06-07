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

const TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  nueva_postulacion:         { label: 'Nueva postulación',       cls: 'bg-blue-900/40 text-blue-400' },
  postulacion_enviada:       { label: 'Postulación enviada',     cls: 'bg-zinc-700 text-zinc-300' },
  postulacion_aceptada:      { label: 'Postulación aceptada',    cls: 'bg-green-900/40 text-green-400' },
  postulacion_rechazada:     { label: 'Postulación rechazada',   cls: 'bg-red-900/40 text-red-400' },
  nuevo_rating:              { label: 'Nueva calificación',      cls: 'bg-yellow-900/40 text-yellow-400' },
  nuevo_mensaje:             { label: 'Mensaje nuevo',           cls: 'bg-indigo-900/40 text-indigo-400' },
  trabajo_completado:        { label: 'Trabajo completado',      cls: 'bg-emerald-900/40 text-emerald-400' },
  verificacion_aprobada:     { label: 'Verificación aprobada',   cls: 'bg-green-900/40 text-green-400' },
  verificacion_rechazada:    { label: 'Verificación rechazada',  cls: 'bg-red-900/40 text-red-400' },
  recordatorio_calificacion: { label: 'Calificación pendiente',  cls: 'bg-orange-900/40 text-orange-400' },
}

function formatTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)  return 'ahora'
  if (min < 60) return `hace ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24)   return `hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)    return `hace ${d}d`
  return new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

type Props = {
  initialNotifs: Notificacion[]
  userId: string
  initialUnread: number
}

export default function NotificacionesList({ initialNotifs, userId, initialUnread }: Props) {
  const [notifs, setNotifs]   = useState(initialNotifs)
  const [unread, setUnread]   = useState(initialUnread)
  // Marcar como leídas al cargar y reflejar el cambio en el estado local inmediatamente
  useEffect(() => {
    if (initialUnread > 0) {
      marcarTodasLeidas()
      setNotifs(prev => prev.map(n => ({ ...n, read: true })))
      setUnread(0)
    }
  }, [])

  // Suscripción Realtime — nuevas notificaciones mientras la página está abierta
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | undefined
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)

      channel = supabase
        .channel(`notif-page-${userId}`)
        .on('postgres_changes', {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
        }, (payload) => {
          const nueva = payload.new as Notificacion
          if (nueva.user_id !== userId) return
          setNotifs(prev => [{ ...nueva, read: false }, ...prev])
          setUnread(c => c + 1)
        })
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [userId])

  function handleMarcarTodas() {
    marcarTodasLeidas()
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          {unread > 0 && (
            <p className="mt-1 text-sm text-zinc-400">{unread} sin leer</p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarcarTodas}
            className="rounded-lg border border-surface-2 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-surface-2 hover:text-white"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Lista */}
      {notifs.length === 0 ? (
        <div className="rounded-2xl border border-surface-2 bg-surface-1 px-6 py-16 text-center">
          <p className="text-4xl">🔔</p>
          <p className="mt-3 text-sm font-medium text-zinc-300">Todo tranquilo por acá</p>
          <p className="mt-1 text-xs text-zinc-500">Cuando alguien se postule o te califique, te avisamos aquí.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifs.map(n => {
            const typeInfo = TYPE_CONFIG[n.type] ?? { label: n.type, cls: 'bg-surface-2 text-zinc-400' }
            return (
              <Link
                key={n.id}
                href={n.link}
                className={`flex items-start gap-4 rounded-xl border px-4 py-4 transition-colors hover:bg-surface-2 ${
                  n.read
                    ? 'border-surface-2 bg-surface-0'
                    : 'border-surface-2 bg-surface-1'
                }`}
              >
                {/* Indicador de no leído */}
                <div className="mt-1 shrink-0">
                  {n.read
                    ? <span className="block h-2 w-2 rounded-full" />
                    : <span className="block h-2 w-2 rounded-full bg-blue-500" />
                  }
                </div>

                {/* Contenido */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.cls}`}>
                      {typeInfo.label}
                    </span>
                    <span className="text-xs text-zinc-500">{formatTime(n.created_at)}</span>
                  </div>
                  <p className={`mt-1.5 text-sm leading-snug ${n.read ? 'text-zinc-400' : 'text-zinc-200'}`}>
                    {n.message}
                  </p>
                </div>

                {/* Flecha */}
                <span className="mt-1 shrink-0 text-zinc-600">›</span>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
