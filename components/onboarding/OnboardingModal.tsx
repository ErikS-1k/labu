'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { completarOnboarding } from '@/app/actions/perfil'

const STEPS = [
  {
    emoji: '👤',
    title: 'Completá tu perfil',
    desc: 'Agregá tu foto, una bio y tu zona. Así otros usuarios van a saber quién sos y confiar en vos.',
    cta: 'Completar perfil',
    href: '/perfil/editar',
  },
  {
    emoji: '📢',
    title: 'Publicá tu primer servicio o búsqueda',
    desc: 'Ofrecé lo que sabés hacer, o publicá lo que necesitás contratar. Es gratis y tarda menos de un minuto.',
    cta: 'Publicar ahora',
    href: '/publicar',
  },
  {
    emoji: '🔍',
    title: 'Explorá las publicaciones',
    desc: 'Mirá lo que otros ofrecen y buscan. Podés contactarlos directamente sin intermediarios.',
    cta: 'Explorar',
    href: '/panel',
  },
]

export default function OnboardingModal({ firstName }: { firstName?: string | null }) {
  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function cerrar(href?: string) {
    setOpen(false)
    startTransition(async () => {
      await completarOnboarding()
      if (href && href !== '/panel') router.push(href)
    })
  }

  if (!open) return null

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 px-4 pb-4 sm:items-center sm:pb-0">
      <div className="w-full max-w-md rounded-2xl border border-surface-2 bg-surface-0 p-7">

        {/* Bienvenida (solo en paso 1) */}
        {step === 0 && firstName && (
          <p className="mb-5 text-sm font-medium text-zinc-400">
            ¡Hola, {firstName}! Antes de empezar, te mostramos cómo sacarle el máximo provecho a Labu.
          </p>
        )}
        {step === 0 && !firstName && (
          <p className="mb-5 text-sm font-medium text-zinc-400">
            ¡Bienvenido/a! Te mostramos cómo sacarle el máximo provecho a Labu.
          </p>
        )}

        {/* Indicador de pasos */}
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === step ? 'flex-1 bg-white' : 'w-6 bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Contenido del paso */}
        <div className="mb-7 text-center">
          <div className="mb-4 text-5xl">{current.emoji}</div>
          <h2 className="text-xl font-bold text-white">{current.title}</h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-400">{current.desc}</p>
        </div>

        {/* Botón principal de acción */}
        <button
          onClick={() => cerrar(current.href)}
          disabled={isPending}
          className="w-full rounded-xl bg-white py-3.5 text-base font-bold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {current.cta}
        </button>

        {/* Navegación secundaria */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={step > 0 ? () => setStep(s => s - 1) : undefined}
            className={`text-sm transition-colors ${
              step > 0
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'invisible'
            }`}
          >
            ← Anterior
          </button>

          <div className="flex gap-4">
            <button
              onClick={() => cerrar()}
              disabled={isPending}
              className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Hacer esto después
            </button>
            {!isLast && (
              <button
                onClick={() => setStep(s => s + 1)}
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
