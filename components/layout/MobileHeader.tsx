'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function IconBell() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function getPageTitle(pathname: string, userId: string | null): string {
  if (pathname === '/panel')            return 'Inicio'
  if (pathname === '/buscar')           return 'Buscar'
  if (pathname === '/publicar')         return 'Nueva publicación'
  if (pathname === '/mensajes')         return 'Mensajes'
  if (pathname === '/mensajes/nuevo')   return 'Nueva conversación'
  if (pathname.startsWith('/mensajes/')) return 'Conversación'
  if (pathname === '/mi-actividad')     return 'Mi actividad'
  if (pathname === '/notificaciones')   return 'Notificaciones'
  if (pathname === '/verificacion')     return 'Verificación'
  if (pathname === '/perfil/editar')    return 'Editar perfil'
  if (pathname.startsWith('/perfil/')) {
    const segment = pathname.split('/')[2]
    return userId && segment === userId ? 'Mi perfil' : 'Perfil'
  }
  if (pathname.startsWith('/editar/'))  return 'Editar publicación'
  if (pathname.startsWith('/post/'))    return 'Publicación'
  if (pathname === '/ofertas')          return 'Servicios'
  if (pathname === '/requerimientos')   return 'Búsquedas'
  return ''
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
  const title = getPageTitle(pathname, userId)

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
    <header className="sticky top-0 z-10 flex items-center border-b border-surface-2/50 bg-surface-1/90 px-4 py-2.5 backdrop-blur-sm md:hidden">
      {title && (
        <span className="text-[15px] font-semibold text-white">{title}</span>
      )}
      <Link
        href="/notificaciones"
        className="relative ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-surface-2 bg-surface-0 text-zinc-400 transition-colors hover:text-white"
        aria-label="Notificaciones"
      >
        <IconBell />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    </header>
  )
}
