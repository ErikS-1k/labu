'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'

type Props = {
  isLoggedIn: boolean
  userId: string | null
  userName: string | null
  unreadCount: number
}

export default function HeaderNav({ isLoggedIn, userId, userName, unreadCount }: Props) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(unreadCount)
  const pathname = usePathname()

  // Resetear cuando el usuario entra a mensajes
  useEffect(() => {
    if (pathname === '/mensajes' || pathname.startsWith('/mensajes/')) {
      setCount(0)
    }
  }, [pathname])

  // Suscripción Realtime — incrementa cuando llega un mensaje nuevo
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const channel = supabase
      .channel('header-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as { receiver_id: string }
        if (msg.receiver_id === userId) setCount(c => c + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return (
    <>
      {/* Desktop nav — derecha */}
      <nav className="hidden items-center gap-4 text-sm md:flex">
        {isLoggedIn ? (
          <>
            <Link href="/panel" className="text-zinc-600 hover:text-zinc-900">
              Panel
            </Link>
            <Link href="/publicar" className="rounded-lg bg-zinc-900 px-3 py-1.5 text-white transition-colors hover:bg-zinc-700">
              Publicar
            </Link>
            <Link href="/mensajes" className="relative text-zinc-600 hover:text-zinc-900">
              Mensajes
              {count > 0 && (
                <span className="absolute -right-3 -top-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
            <Link href={`/perfil/${userId}`} className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
              {userName ?? 'Mi perfil'}
            </Link>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Entrar
          </Link>
        )}
      </nav>

      {/* Mobile nav */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          aria-label="Menú"
        >
          {open ? '✕' : '☰'}
        </button>
        {isLoggedIn && (
          <Link
            href="/publicar"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-700"
          >
            Publicar
          </Link>
        )}
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-zinc-200 bg-white px-4 py-3 shadow-sm md:hidden">
          <nav className="flex flex-col gap-1 text-sm">
            <Link href="/buscar" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-zinc-50">
              Buscar
            </Link>
            <Link href="/panel" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-zinc-50">
              Panel
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/mensajes" onClick={() => setOpen(false)} className="relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-zinc-50">
                  Mensajes
                  {count > 0 && (
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </Link>
                <Link href={`/perfil/${userId}`} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-zinc-50">
                  {userName ? `${userName} — Mi perfil` : 'Mi perfil'}
                </Link>
                <div className="mt-1 border-t border-zinc-100 pt-1">
                  <form action={logout}>
                    <button type="submit" className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-zinc-400 hover:bg-zinc-50">
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-zinc-50">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
