'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  type: string
  message: string
  link: string
  read: boolean
  created_at: string
}

function IconBell() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read).length

  async function fetchNotifications() {
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotifications(data)
  }

  async function markAllRead() {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  useEffect(() => {
    fetchNotifications()

    const supabase = createClient()
    const channel = supabase
      .channel('notification-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        const n = payload.new as Notification
        setNotifications(prev => [n, ...prev].slice(0, 20))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  function handleOpen() {
    setIsOpen(o => !o)
    if (!isOpen && unread > 0) markAllRead()
  }

  function handleClose() {
    setIsOpen(false)
  }

  function formatTime(ts: string) {
    const diff = Date.now() - new Date(ts).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'ahora'
    if (min < 60) return `${min}m`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors w-full ${
          isOpen ? 'bg-surface-2 text-white' : 'text-zinc-500 hover:bg-surface-2 hover:text-zinc-200'
        }`}
      >
        <span className="relative shrink-0">
          <IconBell />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
        <span className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100">
          Notificaciones
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop invisible */}
          <div className="fixed inset-0 z-40" onClick={handleClose} />

          {/* Panel — fixed para no quedar clippeado por overflow-hidden del sidebar */}
          <div className="fixed left-14 top-auto z-50 mt-0 w-80 rounded-xl border border-surface-2 bg-surface-1 shadow-lg"
            style={{ bottom: 'auto' }}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <span className="text-sm font-semibold text-white">Notificaciones</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-zinc-400 hover:text-zinc-600">
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-zinc-400">No tenés notificaciones</p>
              ) : (
                notifications.map(n => (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={handleClose}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2 ${!n.read ? 'bg-blue-50/50' : ''}`}
                  >
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                    {n.read && <span className="mt-1.5 h-2 w-2 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-700 leading-snug">{n.message}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">{formatTime(n.created_at)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
