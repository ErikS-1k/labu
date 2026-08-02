import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import VerificacionForm from '@/components/verificacion/VerificacionForm'

export const metadata: Metadata = { title: 'Verificar identidad — Labu' }

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
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link
        href={`/perfil/${user!.id}`}
        className="mb-6 inline-block text-sm text-zinc-400 hover:text-zinc-700"
      >
        ← Volver al perfil
      </Link>

      <h1 className="mb-2 text-xl font-bold text-white">Verificá tu identidad</h1>
      <p className="mb-8 text-sm text-zinc-500">
        El badge de verificación le muestra a otros usuarios que sos una persona real.
        Aumenta la confianza y tus chances de ser contratado o de conseguir candidatos serios.
      </p>

      {/* Qué subir */}
      <div className="mb-6 rounded-xl border border-surface-2 bg-surface-1 p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Qué necesitás subir</h2>
        <ul className="flex flex-col gap-2 text-sm text-zinc-600">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-base">📄</span>
            <span>Una foto del <strong>frente o dorso de tu DNI</strong> argentino</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-base">✓</span>
            <span>Formatos aceptados: JPG, PNG o PDF · máximo 5MB</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-base">🔒</span>
            <span>Tu documento es privado y solo lo ve el equipo de Labu para verificar tu identidad</span>
          </li>
        </ul>
      </div>

      {/* Cómo funciona */}
      <div className="mb-8 rounded-xl border border-surface-2 bg-surface-1 p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Cómo funciona</h2>
        <ol className="flex flex-col gap-3">
          {[
            'Subís una foto de tu DNI (frente o dorso).',
            'Nuestro equipo la revisa en 24 a 48 horas.',
            'Si todo está bien, aparece el badge Verificado en tu perfil.',
          ].map((paso, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-zinc-600">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500">
                {i + 1}
              </span>
              {paso}
            </li>
          ))}
        </ol>
      </div>

      {/* Formulario */}
      <div className="rounded-xl border border-surface-2 bg-surface-1 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700">Subir documento</h2>
        <VerificacionForm userId={user!.id} />
      </div>
    </main>
  )
}
