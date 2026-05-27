import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let firstName: string | null = null
  if (user) {
    const { data } = await supabase.from('users').select('first_name').eq('id', user.id).single()
    firstName = data?.first_name ?? null
  }

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
        {user ? (
          <Link
            href={`/perfil/${user.id}`}
            className="rounded-lg border border-white/20 px-4 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/5"
          >
            {firstName ? `Hola, ${firstName}` : 'Mi perfil'}
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-lg border border-white/20 px-4 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/5"
          >
            Iniciar sesión
          </Link>
        )}
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
          Ofrecé tus servicios o publicá lo que necesitás.<br />
          Inmediato, temporal o permanente.
        </p>

        {/* Rubros */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <span className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            Oficios
          </span>
          <span className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            Tecnología
          </span>
          <span className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            Profesional
          </span>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          {!user && (
            <Link
              href="/registro"
              className="rounded-xl bg-white px-7 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              Crear cuenta gratis
            </Link>
          )}
          <Link
            href="/panel"
            className="rounded-xl bg-white/10 border border-white/20 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            Comenzar
          </Link>
        </div>
      </div>
    </div>
  )
}
