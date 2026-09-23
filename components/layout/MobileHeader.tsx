'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { avatarBg } from '@/lib/avatar'

function IconBell() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

type PageConfig = { title: string; subtitle: string }

const PAGES: Record<string, PageConfig> = {
  '/panel':          { title: 'Inicio',        subtitle: 'Descubrí quién puede ayudarte' },
  '/buscar':         { title: 'Buscar',         subtitle: 'Encontrá personas, servicios o trabajo' },
  '/mensajes':       { title: 'Mensajes',       subtitle: 'Tus conversaciones activas' },
  '/mi-actividad':   { title: 'Mi actividad',   subtitle: 'Tus publicaciones y postulaciones' },
  '/notificaciones': { title: 'Notificaciones', subtitle: 'Tus novedades recientes' },
}

function getConfig(pathname: string, userId: string | null): PageConfig | null {
  // Perfil propio
  if (pathname.startsWith('/perfil/') && !pathname.startsWith('/perfil/editar')) {
    const segment = pathname.split('/')[2]
    if (userId && segment === userId) {
      return { title: 'Mi perfil', subtitle: 'Gestioná tu información y trabajos' }
    }
  }
  return PAGES[pathname] ?? null
}

export default function MobileHeader({
  userId,
  userName,
  userUsername,
  userAvatarUrl,
  initialCount = 0,
}: {
  userId: string | null
  userName: string | null
  userUsername: string | null
  userAvatarUrl: string | null
  initialCount: number
}) {
  const [unread, setUnread] = useState(initialCount)
  const pathname = usePathname()
  const config = getConfig(pathname, userId)

  // Marcar como leídas al entrar a notificaciones
  useEffect(() => {
    if (pathname === '/notificaciones') setUnread(0)
  }, [pathname])

  // Suscripción realtime para nuevas notificaciones
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

  // Solo se muestra en páginas raíz con configuración definida
  if (!userId || !config) return null

  const enPerfilPropio = pathname === `/perfil/${userId}`

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-8 pb-1 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{config.title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{config.subtitle}</p>
        </div>

        <div className="mt-0.5 flex shrink-0 items-center gap-2">
          <Link
            href="/notificaciones"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-blue-400 transition-colors hover:bg-zinc-800"
            aria-label="Notificaciones"
          >
            <IconBell />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          {/* Acceso al perfil propio (reemplaza el ítem "Perfil" de la barra inferior) */}
          <Link
            href={`/perfil/${userId}`}
            aria-label="Mi perfil"
            className={`flex h-10 w-10 items-center justify-center rounded-full ring-2 transition-colors ${
              enPerfilPropio ? 'ring-blue-500' : 'ring-zinc-800 hover:ring-zinc-600'
            }`}
          >
            {userAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userAvatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${avatarBg(userUsername, userName, userId)}`}>
                {(userName ?? userUsername ?? '?').charAt(0).toUpperCase()}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}
