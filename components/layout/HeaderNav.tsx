'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  const [searchQ, setSearchQ] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = searchQ.trim()
    router.push(trimmed ? `/buscar?q=${encodeURIComponent(trimmed)}` : '/buscar')
    setSearchQ('')
  }

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
            <Link href="/panel" className="text-zinc-400 hover:text-white">
              Panel
            </Link>
            <Link href="/publicar" className="rounded-lg bg-white px-3 py-1.5 text-zinc-900 transition-colors hover:bg-zinc-200">
              Publicar
            </Link>
            <form onSubmit={handleSearch}>
              <input
                type="search"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Buscar..."
                className="w-36 rounded-lg border border-surface-2 bg-surface-2 px-3 py-1.5 text-sm outline-none transition-all focus:w-48 focus:border-zinc-600"
              />
            </form>
            <Link href="/mensajes" className="relative text-zinc-400 hover:text-white">
              Mensajes
              {count > 0 && (
                <span className="absolute -right-3 -top-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
            <Link href={`/perfil/${userId}`} className="text-sm font-medium text-zinc-300 hover:text-white">
              {userName ?? 'Mi perfil'}
            </Link>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-700 transition-colors hover:bg-surface-2"
          >
            Entrar
          </Link>
        )}
      </nav>

      {/* Mobile nav */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-surface-2"
          aria-label="Menú"
        >
          {open ? '✕' : '☰'}
        </button>
        {isLoggedIn && (
          <Link
            href="/publicar"
            className="rounded-lg bg-white px-3 py-1.5 text-sm text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            Publicar
          </Link>
        )}
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-surface-2 bg-surface-0 px-4 py-3 shadow-sm md:hidden">
          <nav className="flex flex-col gap-1 text-sm">
            <Link href="/buscar" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-surface-2">
              Buscar
            </Link>
            <Link href="/panel" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-surface-2">
              Panel
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/mensajes" onClick={() => setOpen(false)} className="relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-surface-2">
                  Mensajes
                  {count > 0 && (
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </Link>
                <Link href={`/perfil/${userId}`} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-surface-2">
                  {userName ? `${userName} — Mi perfil` : 'Mi perfil'}
                </Link>
                <div className="mt-1 border-t border-zinc-100 pt-1">
                  <form action={logout}>
                    <button type="submit" className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-zinc-400 hover:bg-surface-2">
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-surface-2">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
