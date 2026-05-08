import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
          Labu
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/ofertas" className="text-zinc-600 hover:text-zinc-900">
            Ofertas
          </Link>
          <Link href="/requerimientos" className="text-zinc-600 hover:text-zinc-900">
            Requerimientos
          </Link>

          {user ? (
            <>
              <Link href="/mensajes" className="text-zinc-600 hover:text-zinc-900">
                Mensajes
              </Link>
              <Link href="/perfil" className="text-zinc-600 hover:text-zinc-900">
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
      </div>
    </header>
  )
}
