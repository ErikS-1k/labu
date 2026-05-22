'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  userId: string
  userName: string | null
  unreadCount: number
}

function IconHome() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function IconPlus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function IconSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function IconMessage() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function IconUser() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

export default function BottomNav({ userId, userName, unreadCount }: Props) {
  const [count, setCount] = useState(unreadCount)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/mensajes' || pathname.startsWith('/mensajes/')) {
      setCount(0)
    }
  }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('bottomnav-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as { receiver_id: string }
        if (msg.receiver_id === userId) setCount(c => c + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  function isActive(href: string) {
    if (href === '/panel') return pathname === '/panel' || pathname.startsWith('/panel?')
    return pathname === href || pathname.startsWith(href + '/')
  }

  function iconClass(href: string) {
    return `flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
      isActive(href) ? 'text-zinc-900' : 'text-zinc-400'
    }`
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-around border-t border-zinc-200 bg-white md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Link href="/panel" className={iconClass('/panel')}>
        <IconHome />
      </Link>
      <Link href="/publicar" className={iconClass('/publicar')}>
        <IconPlus />
      </Link>
      <Link href="/buscar" className={iconClass('/buscar')}>
        <IconSearch />
      </Link>
      <Link href="/mensajes" className={`${iconClass('/mensajes')} relative`}>
        <IconMessage />
        {count > 0 && (
          <span className="absolute right-1.5 top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Link>
      <Link href={`/perfil/${userId}`} className={iconClass(`/perfil/${userId}`)}>
        <IconUser />
      </Link>
    </nav>
  )
}
