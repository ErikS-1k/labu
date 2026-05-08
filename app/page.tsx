import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Labu</h1>
        <p className="mt-2 text-zinc-500">Marketplace de trabajo</p>

        <div className="mt-8">
          {user ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-600">
                Hola, <span className="font-medium text-zinc-900">{user.email}</span>
              </p>
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href="/registro"
                className="block rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="block rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                Iniciar sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
