'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { marcarNotificacionesLeidas, marcarTodasLeidas } from '@/app/actions/notifications'
import type { NotifItem } from '@/lib/notificaciones'
import NotificacionesList from './NotificacionesList'

// Pantalla completa /notificaciones (mobile, o entrando directo por URL en desktop).
// Igual que antes: al entrar marca todo como leído a los 1,5 s (las nuevas se ven destacadas
// un momento). En desktop el panel de la barra lateral, en cambio, marca al tocar cada una.
export default function NotificacionesPagina({ items, userId }: { items: NotifItem[]; userId: string }) {
  const router = useRouter()
  const [leidas, setLeidas] = useState<Set<string>>(new Set())
  const hayNoLeidas = items.some(n => !n.read)

  useEffect(() => {
    if (!hayNoLeidas) return
    const t = setTimeout(() => {
      marcarTodasLeidas()
      setLeidas(new Set(items.flatMap(n => n.ids)))
    }, 1500)
    return () => clearTimeout(t)
  }, [hayNoLeidas, items])

  // Realtime: si llega una notificación nueva, el servidor vuelve a armar la lista
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
          if ((payload.new as { user_id: string }).user_id === userId) router.refresh()
        })
        .subscribe()
    })
    return () => { cancelled = true; if (channel) supabase.removeChannel(channel) }
  }, [userId, router])

  const lista = items.map(n => (n.ids.every(id => leidas.has(id)) ? { ...n, read: true } : n))

  function tocar(n: NotifItem) {
    if (!n.read) marcarNotificacionesLeidas(n.ids)
    router.push(n.href)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#171717]">
      <NotificacionesList items={lista} onTocar={tocar} />
    </div>
  )
}
