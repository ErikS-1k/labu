'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MenuMas from './MenuMas'

type Props = {
  userId: string | null
  unreadCount: number
  unreadActividadCount: number
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

function IconMenu() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6"/>
      <line x1="4" y1="12" x2="20" y2="12"/>
      <line x1="4" y1="18" x2="20" y2="18"/>
    </svg>
  )
}

function IconLogin() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  )
}

const TIPOS_ACTIVIDAD = ['nueva_postulacion', 'postulacion_aceptada', 'postulacion_rechazada', 'trabajo_completado', 'recordatorio_calificacion']

export default function BottomNav({ userId, unreadCount, unreadActividadCount, isLoggedIn }: Props) {
  const [msgCount, setMsgCount] = useState(unreadCount)
  const [actividadCount, setActividadCount] = useState(unreadActividadCount)
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const fromParam    = searchParams.get('from')

  useEffect(() => {
    if (pathname === '/mensajes' || pathname.startsWith('/mensajes/')) setMsgCount(0)
  }, [pathname])

  // Sincronizar el contador de actividad con el servidor
  useEffect(() => {
    setActividadCount(unreadActividadCount)
  }, [unreadActividadCount])

  useEffect(() => {
    if (pathname === '/mi-actividad') setActividadCount(0)
  }, [pathname])

  // Realtime: novedades de actividad (postulaciones, cambios de estado, etc.)
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | undefined
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)
      channel = supabase
        .channel(`bottomnav-actividad-${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
          const notif = payload.new as { user_id: string; type: string }
          if (notif.user_id === userId && TIPOS_ACTIVIDAD.includes(notif.type)) {
            if (window.location.pathname !== '/mi-actividad') setActividadCount(c => c + 1)
          }
        })
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [userId])

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
    return pathname === href || pathname.startsWith(href + '/')
  }

  // "Más" se marca activo en las páginas que se abren desde su popover (mismo criterio que la sidebar)
  const masActivo =
    pathname === '/mi-actividad' ||
    pathname.startsWith('/mi-actividad/') ||
    pathname.startsWith('/editar/') ||
    pathname === '/configuracion' ||
    pathname === '/verificacion' ||
    (pathname.startsWith('/post/') && fromParam === 'mi-actividad')

  function badge(count: number) {
    if (count <= 0) return null
    return (
      <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
        {count > 9 ? '9+' : count}
      </span>
    )
  }

  function navItem(href: string, icon: React.ReactNode, label: string, badge?: React.ReactNode) {
    const active = isActive(href)
    return (
      <Link href={href} className="flex flex-1 items-center justify-center">
        <span className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 ${
          active ? 'bg-blue-500/15 text-blue-400' : 'text-zinc-500'
        }`}>
          <span className="relative">{icon}{badge}</span>
          <span className="text-[10px] font-semibold leading-none">{label}</span>
        </span>
      </Link>
    )
  }

  return (
    <div
      className="fixed left-3 right-3 z-50 md:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
    >
      <nav className="flex items-center rounded-2xl border border-white/10 bg-zinc-900/90 px-1 py-2 shadow-lg shadow-black/40 backdrop-blur-md">
        {navItem('/panel',    <IconHome />,    'Inicio')}
        {navItem('/buscar',   <IconSearch />,  'Buscar')}
        {navItem('/publicar', <IconPlus />,    'Publicar')}
        {navItem('/mensajes', <IconMessage />, 'Mensajes', badge(msgCount))}
        {isLoggedIn ? (
          <MenuMas
            variante="mobile"
            actividadCount={actividadCount}
            triggerClassName="flex flex-1 items-center justify-center"
            trigger={abierto => (
              <span className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 ${
                abierto || masActivo ? 'bg-blue-500/15 text-blue-400' : 'text-zinc-500'
              }`}>
                <span className="relative"><IconMenu />{badge(actividadCount)}</span>
                <span className="text-[10px] font-semibold leading-none">Más</span>
              </span>
            )}
          />
        ) : navItem('/login', <IconLogin />, 'Entrar')}
      </nav>
    </div>
  )
}
