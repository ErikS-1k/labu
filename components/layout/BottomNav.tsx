'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  userId: string | null
  unreadCount: number
  isLoggedIn: boolean
}

function IconHome() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
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

function IconPlus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
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

export default function BottomNav({ userId, unreadCount, isLoggedIn }: Props) {
  const [msgCount, setMsgCount] = useState(unreadCount)
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const fromParam    = searchParams.get('from')

  useEffect(() => {
    if (pathname === '/mensajes' || pathname.startsWith('/mensajes/')) setMsgCount(0)
  }, [pathname])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const channel = supabase
      .channel('bottomnav-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as { receiver_id: string }
        if (msg.receiver_id === userId) setMsgCount(c => c + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  function isActive(href: string) {
    const isPost = pathname.startsWith('/post/')
    if (href === '/panel') return (
      pathname === '/panel' ||
      pathname === '/ofertas' ||
      pathname === '/requerimientos' ||
      (isPost && (!fromParam || fromParam === 'panel'))
    )
    if (href === '/buscar') return pathname === '/buscar' || (isPost && fromParam === 'busqueda')
    if (userId && href === `/perfil/${userId}`) return (
      pathname.startsWith('/perfil/') ||
      pathname === '/verificacion' ||
      (isPost && fromParam === 'perfil')
    )
    return pathname === href || pathname.startsWith(href + '/')
  }

  const perfilHref = isLoggedIn && userId ? `/perfil/${userId}` : '/login'

  const msgBadge = msgCount > 0 ? (
    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
      {msgCount > 9 ? '9+' : msgCount}
    </span>
  ) : null

  function navItem(href: string, icon: React.ReactNode, label: string, badge?: React.ReactNode) {
    const active = isActive(href)
    return (
      <Link href={href} className="flex flex-1 items-center justify-center">
        {active ? (
          <span className="flex flex-col items-center gap-1 rounded-xl bg-indigo-500/20 px-3 py-2 text-indigo-300">
            <span className="relative">{icon}{badge}</span>
            <span className="text-[10px] font-semibold leading-none">{label}</span>
          </span>
        ) : (
          <span className="relative flex min-h-[44px] items-center justify-center p-2.5 text-zinc-500">
            {icon}{badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div
      className="fixed left-4 right-4 z-50 md:hidden"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <nav className="flex items-center rounded-2xl border border-white/10 bg-zinc-900/85 px-1 py-1.5 shadow-lg shadow-black/40 backdrop-blur-md">
        {navItem('/panel',    <IconHome />,    'Inicio')}
        {navItem('/buscar',   <IconSearch />,  'Buscar')}
        {navItem('/publicar', <IconPlus />,    'Publicar')}
        {navItem('/mensajes', <IconMessage />, 'Mensajes', msgBadge)}
        {navItem(perfilHref,  <IconUser />,    isLoggedIn ? 'Perfil' : 'Entrar')}
      </nav>
    </div>
  )
}
