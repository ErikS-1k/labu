'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NotificationBell from './NotificationBell'
import MenuMas from './MenuMas'

type Props = {
  userId: string | null
  userName: string | null
  unreadCount: number
  unreadNotifCount: number
  unreadActividadCount: number
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

function IconMenu() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6"/>
      <line x1="4" y1="12" x2="20" y2="12"/>
      <line x1="4" y1="18" x2="20" y2="18"/>
    </svg>
  )
}

// Texto de cada ítem: visible con hover o mientras el menú "Más" está abierto (data-expandido en el aside)
const labelCls = 'overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100 group-data-[expandido=true]:opacity-100'

function Badge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
      {count > 9 ? '9+' : count}
    </span>
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

export default function PanelSidebar({ userId, userName, unreadCount, unreadNotifCount, unreadActividadCount, isLoggedIn }: Props) {
  const [count, setCount]               = useState(unreadCount)
  const [actividadCount, setActividad]  = useState(unreadActividadCount)
  // Mientras el popover "Más" está abierto el sidebar queda expandido (si se colapsara al
  // mover el mouse hacia el popover, éste quedaría flotando lejos del botón)
  const [menuAbierto, setMenuAbierto]   = useState(false)
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const fromParam    = searchParams.get('from')

  // Sincronizar cuando el layout re-fetchea unreadCount (ej: al abrir un chat)
  useEffect(() => {
    setCount(unreadCount)
  }, [unreadCount])

  // Sincronizar el count de actividad con el servidor
  useEffect(() => {
    setActividad(unreadActividadCount)
  }, [unreadActividadCount])

  // Resetear badge de actividad al visitar la página
  useEffect(() => {
    if (pathname === '/mi-actividad') setActividad(0)
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
        .channel('sidebar-unread')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const msg = payload.new as { receiver_id: string }
          if (msg.receiver_id === userId) setCount(c => c + 1)
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
    let channel: ReturnType<typeof supabase.channel> | undefined
    let cancelled = false
    const TIPOS_ACTIVIDAD = ['nueva_postulacion', 'postulacion_aceptada', 'postulacion_rechazada', 'trabajo_completado', 'recordatorio_calificacion']

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)

      channel = supabase
        .channel(`sidebar-actividad-${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
          const notif = payload.new as { user_id: string; type: string }
          if (notif.user_id === userId && TIPOS_ACTIVIDAD.includes(notif.type)) {
            if (window.location.pathname !== '/mi-actividad') setActividad(c => c + 1)
          }
        })
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
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
      (isPost && fromParam === 'perfil')
    )
    return pathname === href || pathname.startsWith(href + '/')
  }

  function itemClass(href: string) {
    return `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
      isActive(href)
        ? 'bg-blue-500/10 text-blue-400'
        : 'text-zinc-400 hover:bg-surface-2 hover:text-white'
    }`
  }

  // "Más" se marca activo en las páginas que se abren desde su popover
  const masActivo =
    pathname === '/mi-actividad' ||
    pathname.startsWith('/editar/') ||
    pathname === '/configuracion' ||
    pathname === '/verificacion' ||
    (pathname.startsWith('/post/') && fromParam === 'mi-actividad')

  return (
    <aside
      data-expandido={menuAbierto}
      className={`group hidden md:flex h-dvh flex-col border-r border-surface-2 bg-surface-0 transition-[width] duration-200 ease-in-out overflow-hidden shrink-0 ${
        menuAbierto ? 'w-56' : 'w-14 hover:w-56'
      }`}
    >

      {/* Logo — usuarios autenticados van al panel, invitados a la landing */}
      <Link href={isLoggedIn ? '/panel' : '/'} className="flex items-center gap-3 px-3 py-4 border-b border-surface-2 hover:bg-surface-2 transition-colors">
        <img
          src="/_1A1A1A.png"
          alt="Labu"
          className="h-8 w-8 shrink-0 object-contain"
        />
        <span className="overflow-hidden whitespace-nowrap text-base font-bold tracking-tight text-white opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100 group-data-[expandido=true]:opacity-100">
          Labu
        </span>
      </Link>

      {/* Nav items: Inicio · Buscar · Publicar · Mensajes · Notificaciones · Perfil (· Más abajo) */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        <Link href="/panel" className={itemClass('/panel')}>
          <span className="shrink-0"><IconHome /></span>
          <span className={labelCls}>Inicio</span>
        </Link>

        <Link href="/buscar" className={itemClass('/buscar')}>
          <span className="shrink-0"><IconSearch /></span>
          <span className={labelCls}>Buscar</span>
        </Link>

        {isLoggedIn && (
          <Link href="/publicar" className={itemClass('/publicar')}>
            <span className="shrink-0"><IconPlus /></span>
            <span className={labelCls}>Publicar</span>
          </Link>
        )}

        {isLoggedIn && (
          <Link href="/mensajes" className={itemClass('/mensajes')}>
            <span className="relative shrink-0">
              <IconMessage />
              <Badge count={count} />
            </span>
            <span className={labelCls}>Mensajes</span>
          </Link>
        )}

        {isLoggedIn && userId && (
          <NotificationBell userId={userId} initialCount={unreadNotifCount} />
        )}

        {isLoggedIn && userId ? (
          <Link href={`/perfil/${userId}`} className={itemClass(`/perfil/${userId}`)}>
            <span className="shrink-0"><IconUser /></span>
            <span className={labelCls}>{userName ?? 'Mi perfil'}</span>
          </Link>
        ) : (
          <Link href="/login" className={itemClass('/login')}>
            <span className="shrink-0"><IconUser /></span>
            <span className={labelCls}>Entrar</span>
          </Link>
        )}
      </nav>

      {/* Más — popover con configuración, actividad, verificación y salir */}
      {isLoggedIn && (
        <div className="border-t border-surface-2 p-2">
          <MenuMas
            variante="desktop"
            actividadCount={actividadCount}
            onOpenChange={setMenuAbierto}
            triggerClassName={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              menuAbierto || masActivo
                ? 'bg-blue-500/10 text-blue-400'
                : 'text-zinc-400 hover:bg-surface-2 hover:text-white'
            }`}
            trigger={() => (
              <>
                <span className="relative shrink-0">
                  <IconMenu />
                  <Badge count={actividadCount} />
                </span>
                <span className={labelCls}>Más</span>
              </>
            )}
          />
        </div>
      )}
    </aside>
  )
}
