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

export default function NotificationBell({ userId }: { userId: string }) {
  const [unread, setUnread] = useState(0)
  const pathname = usePathname()

  const isActive = pathname === '/notificaciones'

  useEffect(() => {
    const supabase = createClient()

    // Cargar count inicial
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
      .then(({ count }) => setUnread(count ?? 0))

    // Realtime: nuevas notificaciones incrementan el badge
    const channel = supabase
      .channel('notif-bell')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => {
        setUnread(c => c + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
      <span className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100">
        Notificaciones
      </span>
    </Link>
  )
}
