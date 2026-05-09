import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/panel')

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-black text-white">
      {/* Dot grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, #ffffff18 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />
      {/* Fade hacia los bordes */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 45%, transparent 25%, #000000 72%)',
      }} />

      {/* Glow central */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative flex items-center justify-between px-8 py-6">
        <span className="text-lg font-bold tracking-tight">Labu</span>
        <Link
          href="/login"
          className="rounded-lg border border-white/20 px-4 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/5"
        >
          Iniciar sesión
        </Link>
      </nav>

      {/* Hero */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl">
          Conectando el trabajo<br />
          del{' '}
          <span className="bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Futuro
          </span>
        </h1>

        <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400">
          Labu permite encontrar trabajo y contratar talento, en un mismo lugar.
          <br />
          Cualquier rubro, cualquier modalidad.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/registro"
            className="rounded-xl bg-white px-7 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/panel"
            className="rounded-xl border border-white/20 px-7 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5"
          >
            Panel
          </Link>
        </div>
      </div>
    </div>
  )
}
