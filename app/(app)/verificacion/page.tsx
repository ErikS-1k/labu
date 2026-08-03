import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import VerificacionForm from '@/components/verificacion/VerificacionForm'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Verificar identidad — Labu' }

// ─── Íconos inline ────────────────────────────────────────────────────────────

function IconShieldCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  )
}

function IconLock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function IconBadge() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  )
}

function IconClock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

// ─── Datos estáticos ──────────────────────────────────────────────────────────

const beneficios = [
  {
    icon: IconBadge,
    color: 'bg-blue-500/15 text-blue-400',
    title: 'Badge verificado',
    desc: 'Aparecé destacado en publicaciones y perfil.',
  },
  {
    icon: IconLock,
    color: 'bg-green-500/15 text-green-400',
    title: 'Documento privado',
    desc: 'Solo lo ve el equipo de Labu para validar tu identidad.',
  },
  {
    icon: IconClock,
    color: 'bg-orange-500/15 text-orange-400',
    title: 'Rápido y simple',
    desc: '24 a 48 horas y quedás verificado.',
  },
]

const pasos = [
  { title: 'Subí tu DNI',        desc: 'Foto del frente o dorso, argentino. JPG, PNG o PDF.' },
  { title: 'Esperá la revisión', desc: 'Nuestro equipo lo revisa en 24 a 48 horas.' },
  { title: 'Listo',              desc: 'Aparece el badge Verificado en tu perfil.' },
]

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function VerificacionPage() {
  const supabase = await createClient()
  const user = await getAuthUser()

  const { data: verificacion } = await supabase
    .from('verifications')
    .select('status')
    .eq('user_id', user!.id)
    .maybeSingle()

  if (verificacion) redirect(`/perfil/${user!.id}`)

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">

      {/* ── Hero ── */}
      <div className="mb-14 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20">
          <IconShieldCheck />
        </div>
        <h1 className="text-3xl font-bold text-white">Verificá tu identidad</h1>
        <p className="mx-auto mt-3 max-w-sm text-zinc-400">
          Ganá la confianza de otros usuarios y accedé a más oportunidades en Labu.
        </p>
      </div>

      {/* ── Beneficios ── */}
      <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {beneficios.map(b => (
          <div key={b.title} className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${b.color}`}>
              <b.icon />
            </div>
            <h3 className="text-sm font-semibold text-white">{b.title}</h3>
            <p className="mt-1 text-sm text-zinc-500">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Pasos ── */}
      <div className="mb-12">
        <h2 className="mb-8 text-center text-xl font-bold text-white">En 3 pasos</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {pasos.map((paso, i) => (
            <div key={i} className="flex items-start gap-4 md:flex-col md:items-center md:text-center md:gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-base font-bold text-white">
                {i + 1}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{paso.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{paso.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="rounded-2xl bg-gradient-to-b from-blue-600 to-blue-700 p-8 text-center md:p-10">
        <h2 className="text-xl font-bold text-white">¿Listo para verificarte?</h2>
        <p className="mt-2 text-sm text-blue-100">
          Formatos aceptados: JPG, PNG o PDF · máximo 5MB
        </p>
        <div className="mt-6">
          <VerificacionForm userId={user!.id} />
        </div>
      </div>

    </main>
  )
}
