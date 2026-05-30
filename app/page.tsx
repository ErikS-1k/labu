import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const RUBROS = [
  { emoji: '🔧', label: 'Plomero' },
  { emoji: '⚡', label: 'Electricista' },
  { emoji: '💻', label: 'Programador' },
  { emoji: '🎨', label: 'Diseñador' },
  { emoji: '📚', label: 'Profesor' },
  { emoji: '🏋️', label: 'Entrenador' },
  { emoji: '🔨', label: 'Carpintero' },
  { emoji: '🧹', label: 'Limpieza' },
  { emoji: '📊', label: 'Contador' },
  { emoji: '📸', label: 'Fotógrafo' },
  { emoji: '🍳', label: 'Chef' },
  { emoji: '📱', label: 'Marketing' },
  { emoji: '🏠', label: 'Pintor' },
  { emoji: '🐾', label: 'Mascotas' },
  { emoji: '🚗', label: 'Mecánico' },
  { emoji: '⚖️', label: 'Abogado' },
  { emoji: '🌿', label: 'Jardinero' },
  { emoji: '💆', label: 'Masajista' },
  { emoji: '🏥', label: 'Enfermero/a' },
  { emoji: '👶', label: 'Niñero/a' },
]

const PASOS = [
  {
    n: '1',
    title: 'Creá tu cuenta',
    desc: 'Gratis y en menos de un minuto.',
  },
  {
    n: '2',
    title: 'Publicá o explorá',
    desc: 'Ofrecé tu servicio o encontrá a quien necesitás.',
  },
  {
    n: '3',
    title: 'Conectate y trabajá',
    desc: 'Contactá directamente, acordá los detalles y listo.',
  },
]

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let firstName: string | null = null
  if (user) {
    const { data } = await supabase.from('users').select('first_name').eq('id', user.id).single()
    firstName = data?.first_name ?? null
  }

  return (
    <main className="bg-black text-white">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative flex min-h-dvh flex-col overflow-hidden">
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
        <nav className="relative flex items-center justify-between px-6 py-5 md:px-10">
          <span className="text-lg font-bold tracking-tight">Labu</span>
          {user ? (
            <Link
              href={`/perfil/${user.id}`}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/5"
            >
              {firstName ? `Hola, ${firstName}` : 'Mi perfil'}
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-white/60 transition-colors hover:text-white"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </nav>

        {/* Hero content */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl">
            Encontrá trabajo<br />
            o encontrá a quien<br />
            <span className="bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              necesitás
            </span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-400">
            Plomeros, programadores, profesores, diseñadores.<br />
            Todos los rubros. Sin intermediarios.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            {!user ? (
              <>
                <Link
                  href="/registro"
                  className="w-full rounded-xl bg-white px-8 py-3.5 text-base font-bold text-black transition-colors hover:bg-zinc-200 sm:w-auto"
                >
                  Crear cuenta gratis
                </Link>
                <Link
                  href="/panel"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/20 sm:w-auto"
                >
                  Explorar publicaciones
                </Link>
              </>
            ) : (
              <Link
                href="/panel"
                className="rounded-xl bg-white px-8 py-3.5 text-base font-bold text-black transition-colors hover:bg-zinc-200"
              >
                Ir al feed
              </Link>
            )}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="relative pb-8 text-center">
          <span className="text-xs text-white/30 uppercase tracking-widest">Seguí leyendo</span>
          <div className="mt-2 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30 animate-bounce">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── QUÉ ES LABU ─────────────────────────────────────────── */}
      <section className="border-t border-white/10 bg-zinc-950 px-6 py-20 text-center md:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-3xl font-bold leading-snug text-white sm:text-4xl md:text-5xl">
            "El lugar donde encontrás<br className="hidden sm:block" />
            trabajo o encontrás a<br className="hidden sm:block" />
            quien necesitás."
          </p>
          <p className="mt-6 text-xl text-zinc-400">
            Sin intermediarios, sin burocracia. Directo.
          </p>
          <p className="mt-4 mx-auto max-w-2xl text-base leading-relaxed text-zinc-500">
            En Labu cualquier persona puede publicar lo que ofrece o lo que necesita. Un plomero puede
            ofrecer su servicio y también buscar un programador para su sitio web. Sin roles fijos,
            sin límites.
          </p>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────────── */}
      <section className="border-t border-white/10 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-2xl font-bold sm:text-3xl">
            Cómo funciona
          </h2>
          <p className="mb-14 text-center text-zinc-400">
            Tres pasos y ya estás conectando con personas reales.
          </p>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {PASOS.map((paso, i) => (
              <div key={paso.n} className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-bold text-black">
                  {paso.n}
                </div>
                {i < PASOS.length - 1 && (
                  <div className="my-4 h-8 w-px bg-white/10 sm:hidden" />
                )}
                <h3 className="mt-5 text-xl font-semibold text-white">{paso.title}</h3>
                <p className="mt-2 text-base text-zinc-400">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA QUIÉN ───────────────────────────────────────────── */}
      <section className="border-t border-white/10 bg-zinc-950 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
            Para quién es Labu
          </h2>
          <p className="mb-10 text-base text-zinc-400">
            Si trabajás o necesitás trabajo, Labu es para vos.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {RUBROS.map(r => (
              <span
                key={r.label}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-base text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
              >
                <span className="text-lg">{r.emoji}</span>
                {r.label}
              </span>
            ))}
            <span className="flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-base text-zinc-600">
              y muchos más…
            </span>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────── */}
      <section className="border-t border-white/10 px-6 py-24 text-center md:py-32">
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
            ¿Listo para empezar?
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Unite gratis. Publicá tu primer servicio o búsqueda en minutos.
          </p>

          {!user ? (
            <Link
              href="/registro"
              className="mt-10 inline-block rounded-xl bg-white px-12 py-4 text-lg font-bold text-black transition-colors hover:bg-zinc-200"
            >
              Empezar ahora
            </Link>
          ) : (
            <Link
              href="/panel"
              className="mt-10 inline-block rounded-xl bg-white px-12 py-4 text-lg font-bold text-black transition-colors hover:bg-zinc-200"
            >
              Ir al feed
            </Link>
          )}

          <p className="mt-4 text-sm text-zinc-600">
            Sin costo. Sin tarjeta de crédito.
          </p>
        </div>
      </section>

    </main>
  )
}
