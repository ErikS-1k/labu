'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  userId: string | null
  userName: string | null
  unreadCount: number
  isLoggedIn: boolean
}

function IconHome() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function IconPlus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function IconSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function IconMessage() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function IconUser() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

export default function PanelSidebar({ userId, userName, unreadCount, isLoggedIn }: Props) {
  const [count, setCount] = useState(unreadCount)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/mensajes' || pathname.startsWith('/mensajes/')) {
      setCount(0)
    }
  }, [pathname])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const channel = supabase
      .channel('sidebar-unread')
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

  function itemClass(href: string) {
    return `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
      isActive(href)
        ? 'bg-zinc-100 text-zinc-900'
        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
    }`
  }

  return (
    <aside className="group hidden md:flex h-screen w-14 hover:w-56 flex-col border-r border-zinc-200 bg-white transition-[width] duration-200 ease-in-out overflow-hidden shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-0 px-[17px] py-5 border-b border-zinc-100">
        <span className="text-lg font-bold tracking-tight text-zinc-900 shrink-0">L</span>
        <span className="overflow-hidden whitespace-nowrap text-lg font-bold tracking-tight text-zinc-900 opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100">
          abu
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        <Link href="/panel" className={itemClass('/panel')}>
          <span className="shrink-0"><IconHome /></span>
          <span className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100">
            Panel
          </span>
        </Link>

        <Link href="/buscar" className={itemClass('/buscar')}>
          <span className="shrink-0"><IconSearch /></span>
          <span className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100">
            Buscar
          </span>
        </Link>

        {isLoggedIn && (
          <Link href="/publicar" className={itemClass('/publicar')}>
            <span className="shrink-0"><IconPlus /></span>
            <span className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100">
              Publicar
            </span>
          </Link>
        )}

        {isLoggedIn && (
          <Link href="/mensajes" className={itemClass('/mensajes')}>
            <span className="relative shrink-0">
              <IconMessage />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </span>
            <span className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100">
              Mensajes
            </span>
          </Link>
        )}

        {isLoggedIn && userId ? (
          <Link href={`/perfil/${userId}`} className={itemClass(`/perfil/${userId}`)}>
            <span className="shrink-0"><IconUser /></span>
            <span className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100">
              {userName ?? 'Mi perfil'}
            </span>
          </Link>
        ) : (
          <Link href="/login" className={itemClass('/login')}>
            <span className="shrink-0"><IconUser /></span>
            <span className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100">
              Entrar
            </span>
          </Link>
        )}
      </nav>
    </aside>
  )
}
