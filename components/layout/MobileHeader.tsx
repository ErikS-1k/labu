'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function IconBell() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

export default function MobileHeader({
  userId,
  initialCount = 0,
}: {
  userId: string | null
  initialCount: number
}) {
  const [unread, setUnread] = useState(initialCount)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/notificaciones') setUnread(0)
  }, [pathname])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | undefined
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)
      channel = supabase
        .channel(`mobile-notif-${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
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

  if (!userId) return null

  return (
    <header className="sticky top-0 z-10 flex items-center justify-end border-b border-surface-2/50 bg-surface-1/90 px-3 py-1.5 backdrop-blur-sm md:hidden">
      <Link
        href="/notificaciones"
        className="relative flex items-center justify-center rounded-lg p-2 text-zinc-400 transition-colors hover:text-white"
        aria-label="Notificaciones"
      >
        <IconBell />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    </header>
  )
}
