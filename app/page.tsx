import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// ── Ilustración SVG: nodos conectados ──────────────────────────────────────

function NetworkIllustration() {
  return (
    <svg viewBox="0 0 480 360" fill="none" aria-hidden="true" className="w-full">
      {/* Líneas hub → satélites */}
      <line x1="240" y1="180" x2="95"  y2="88"  stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <line x1="240" y1="180" x2="345" y2="68"  stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <line x1="240" y1="180" x2="418" y2="188" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="240" y1="180" x2="348" y2="298" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <line x1="240" y1="180" x2="115" y2="298" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="240" y1="180" x2="58"  y2="192" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      {/* Anillo exterior */}
      <line x1="95"  y1="88"  x2="345" y2="68"  stroke="#27272a" strokeWidth="1"/>
      <line x1="345" y1="68"  x2="418" y2="188" stroke="#27272a" strokeWidth="1"/>
      <line x1="418" y1="188" x2="348" y2="298" stroke="#27272a" strokeWidth="1"/>
      <line x1="348" y1="298" x2="115" y2="298" stroke="#27272a" strokeWidth="1"/>
      <line x1="115" y1="298" x2="58"  y2="192" stroke="#27272a" strokeWidth="1"/>
      <line x1="58"  y1="192" x2="95"  y2="88"  stroke="#27272a" strokeWidth="1"/>
      {/* Colas hacia mini nodos */}
      <line x1="95"  y1="88"  x2="172" y2="32"  stroke="#27272a" strokeWidth="1"/>
      <line x1="345" y1="68"  x2="408" y2="28"  stroke="#27272a" strokeWidth="1"/>
      <line x1="418" y1="188" x2="460" y2="275" stroke="#27272a" strokeWidth="1"/>
      {/* Mini nodos flotantes */}
      <circle cx="172" cy="32"  r="5" fill="#1e3a8a"/>
      <circle cx="408" cy="28"  r="5" fill="#1e3a8a"/>
      <circle cx="460" cy="275" r="4" fill="#3f3f46"/>
      <circle cx="188" cy="338" r="4" fill="#1e3a8a"/>
      <circle cx="42"  cy="112" r="4" fill="#3f3f46"/>
      {/* Nodos satélite */}
      <circle cx="95"  cy="88"  r="16" fill="#0f0f0f" stroke="#3b82f6" strokeWidth="2"/>
      <circle cx="345" cy="68"  r="13" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5"/>
      <circle cx="418" cy="188" r="17" fill="#0f0f0f" stroke="#3f3f46" strokeWidth="2"/>
      <circle cx="348" cy="298" r="13" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5"/>
      <circle cx="115" cy="298" r="15" fill="#0f0f0f" stroke="#3f3f46" strokeWidth="2"/>
      <circle cx="58"  cy="192" r="11" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5"/>
      {/* Nodo central */}
      <circle cx="240" cy="180" r="26" fill="#2563eb"/>
      <circle cx="240" cy="180" r="16" fill="white" fillOpacity="0.2"/>
    </svg>
  )
}

// ── Íconos de características ───────────────────────────────────────────────

function IconShield() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function IconLayers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  )
}

function IconClock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function IconZap() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}

// ── Íconos de pasos ─────────────────────────────────────────────────────────

function IconUserPlus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/>
      <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  )
}

function IconCompass() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  )
}

function IconHandshake() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

// ── Datos ───────────────────────────────────────────────────────────────────

const CARACTERISTICAS = [
  { Icon: IconShield,  title: 'Verificación',          desc: 'Perfiles verificados para mayor confianza' },
  { Icon: IconLayers,  title: 'Todos los rubros',      desc: 'Plomeros, electricistas, profesores y muchos más' },
  { Icon: IconClock,   title: 'Todas las duraciones', desc: 'Inmediato, temporal, por proyecto o permanente' },
  { Icon: IconZap,     title: 'Contacto directo',      desc: 'Sin intermediarios ni burocracia' },
]

const CATEGORIAS = [
  { emoji: '🔧', label: 'Plomería' },
  { emoji: '⚡', label: 'Electricidad' },
  { emoji: '🧹', label: 'Limpieza' },
  { emoji: '🪚', label: 'Carpintería' },
  { emoji: '🖌️', label: 'Pintura' },
  { emoji: '🌿', label: 'Jardinería' },
  { emoji: '📦', label: 'Mudanzas' },
  { emoji: '🔨', label: 'Reparaciones del hogar' },
  { emoji: '📚', label: 'Clases particulares' },
  { emoji: '🏋️', label: 'Entrenamiento personal' },
  { emoji: '📸', label: 'Fotografía' },
  { emoji: '🍳', label: 'Cocina y catering' },
]

const PASOS = [
  { Icon: IconUserPlus,  n: '1', title: 'Creá tu cuenta',      desc: 'Gratis y en menos de un minuto.' },
  { Icon: IconCompass,   n: '2', title: 'Publicá o explorá',   desc: 'Ofrecé tu servicio o encontrá a quien necesitás.' },
  { Icon: IconHandshake, n: '3', title: 'Conectate y trabajá', desc: 'Contactá directamente y acordá los detalles.' },
]

// ── Página ──────────────────────────────────────────────────────────────────

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-surface-2 bg-[#0f0f0f]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            Labu
          </Link>
          {user ? (
            <Link
              href="/panel"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Ir al panel
            </Link>
          ) : (
            <div className="flex items-center gap-5">
              <Link href="/login" className="text-sm text-zinc-400 transition-colors hover:text-white">
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24 lg:py-28">
        <div className="flex flex-col items-center gap-10 md:flex-row md:items-center md:gap-16">

          {/* Texto */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              Encontrá personas
              <span className="text-blue-500"> confiables</span>{' '}
              cerca tuyo
            </h1>
            <p className="mx-auto mt-5 max-w-md text-lg text-zinc-400 md:mx-0">
              Plomeros, electricistas, pintores y muchos más. Sin intermediarios.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Link
                href="/buscar"
                className="rounded-xl bg-blue-600 px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Buscar servicios
              </Link>
              <Link
                href={user ? '/publicar' : '/registro'}
                className="rounded-xl border border-zinc-700 px-7 py-3 text-base font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
              >
                Ofrecer mis servicios
              </Link>
            </div>
          </div>

          {/* Ilustración */}
          <div className="w-full max-w-xs shrink-0 md:max-w-sm lg:max-w-md">
            <NetworkIllustration />
          </div>

        </div>
      </section>

      {/* ── Características ── */}
      <section className="border-t border-surface-2 bg-surface-1 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {CARACTERISTICAS.map(({ Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(30,58,138,0.4)] text-blue-400">
                  <Icon />
                </div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categorías ── */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-white sm:text-3xl">
            ¿Qué necesitás hoy?
          </h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {CATEGORIAS.map(cat => (
              <Link
                key={cat.label}
                href={`/buscar?categoria=${encodeURIComponent(cat.label)}`}
                className="flex items-center gap-2.5 rounded-xl border border-surface-2 bg-surface-1 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-[rgba(59,130,246,0.4)] hover:bg-[rgba(30,58,138,0.2)] hover:text-blue-400"
              >
                <span className="text-lg leading-none">{cat.emoji}</span>
                <span className="leading-tight">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="border-t border-surface-2 bg-surface-1 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PASOS.map(({ Icon, n, title, desc }) => (
              <div key={n} className="flex flex-col items-center rounded-2xl border border-surface-2 bg-surface-0 p-7 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Icon />
                </div>
                <span className="mt-5 text-[11px] font-bold uppercase tracking-widest text-blue-500">
                  Paso {n}
                </span>
                <h3 className="mt-2 text-base font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="bg-blue-600 px-6 py-16 text-center md:py-20">
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            ¿Listo para empezar?
          </h2>
          <p className="mt-4 text-base text-blue-100">
            Unite gratis y empezá a conectarte hoy.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/registro"
              className="rounded-xl bg-white px-8 py-3 text-base font-bold text-blue-600 transition-colors hover:bg-blue-50"
            >
              Empezar ahora
            </Link>
            <Link
              href="/panel"
              className="rounded-xl border border-[rgba(255,255,255,0.4)] px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-[rgba(255,255,255,0.1)]"
            >
              Explorar publicaciones
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-2 px-6 py-10 text-zinc-500">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="text-lg font-bold text-white">Labu</span>
              <p className="mt-1 text-sm">El marketplace de trabajo sin intermediarios.</p>
            </div>
            <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <Link href="/panel"    className="transition-colors hover:text-white">Inicio</Link>
              <Link href="/buscar"   className="transition-colors hover:text-white">Explorar</Link>
              <Link href="/publicar" className="transition-colors hover:text-white">Publicar</Link>
              <Link href="/login"    className="transition-colors hover:text-white">Iniciar sesión</Link>
              <Link href="/registro" className="transition-colors hover:text-white">Crear cuenta</Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-surface-2 pt-6 text-xs">
            © 2026 Labu. Todos los derechos reservados.
          </div>
        </div>
      </footer>

    </div>
  )
}
