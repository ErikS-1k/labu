'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

type Props = {
  isLoggedIn: boolean
  userId: string | null
}

export default function HeaderNav({ isLoggedIn, userId }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-4 text-sm md:flex">
        <Link href="/ofertas" className="text-zinc-600 hover:text-zinc-900">
          Ofertas
        </Link>
        <Link href="/requerimientos" className="text-zinc-600 hover:text-zinc-900">
          Requerimientos
        </Link>

        {isLoggedIn ? (
          <>
            <Link href="/mensajes" className="text-zinc-600 hover:text-zinc-900">
              Mensajes
            </Link>
            <Link href={`/perfil/${userId}`} className="text-zinc-600 hover:text-zinc-900">
              Mi perfil
            </Link>
            <Link
              href="/publicar"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-white transition-colors hover:bg-zinc-700"
            >
              Publicar
            </Link>
            <form action={logout}>
              <button type="submit" className="text-zinc-400 hover:text-zinc-700">
                Salir
              </button>
            </form>
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
        {isLoggedIn && (
          <Link
            href="/publicar"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-700"
          >
            Publicar
          </Link>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          aria-label="Menú"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-zinc-200 bg-white px-4 py-3 shadow-sm md:hidden">
          <nav className="flex flex-col gap-1 text-sm">
            <Link
              href="/ofertas"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-zinc-50"
            >
              Ofertas
            </Link>
            <Link
              href="/requerimientos"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-zinc-50"
            >
              Requerimientos
            </Link>
            {isLoggedIn ? (
              <>
                <Link
                  href="/mensajes"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-zinc-50"
                >
                  Mensajes
                </Link>
                <Link
                  href={`/perfil/${userId}`}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-zinc-50"
                >
                  Mi perfil
                </Link>
                <div className="mt-1 border-t border-zinc-100 pt-1">
                  <form action={logout}>
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-zinc-400 hover:bg-zinc-50"
                    >
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-zinc-50"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
