'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function IconBell() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

export default function NotificationBell({ userId, initialCount = 0 }: { userId: string; initialCount?: number }) {
  const [unread, setUnread] = useState(initialCount)
  const pathname = usePathname()

  const isActive = pathname === '/notificaciones'

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | undefined
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)

      channel = supabase
        .channel(`notif-bell-${userId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        }, (payload) => {
          const notif = payload.new as { user_id: string }
          if (notif.user_id === userId) setUnread(c => c + 1)
        })
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [userId])

  // Al visitar la página de notificaciones, resetear el badge localmente
  useEffect(() => {
    if (isActive) setUnread(0)
  }, [isActive])

  return (
    <Link
      href="/notificaciones"
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        isActive
          ? 'bg-surface-2 text-white'
          : 'text-zinc-400 hover:bg-surface-2 hover:text-white'
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
      <span className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100 group-data-[expandido=true]:opacity-100">
        Notificaciones
      </span>
    </Link>
  )
}
