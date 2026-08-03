'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { completarOnboarding } from '@/app/actions/perfil'

type Props = {
  step1Done: boolean
  step2Done: boolean
  step3Done: boolean
}

export default function OnboardingBanner({ step1Done, step2Done, step3Done }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const totalDone = [step1Done, step2Done, step3Done].filter(Boolean).length
  const pct = Math.round((totalDone / 3) * 100)

  function handleExplorar() {
    startTransition(async () => {
      await completarOnboarding()
      router.push('/buscar')
    })
  }

  const steps = [
    {
      title: 'Completá tu perfil',
      desc: 'Agregá tu foto, una descripción y tu ubicación para que te encuentren más fácil.',
      done: step1Done,
      cta: (
        <Link
          href="/perfil/editar"
          className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          Editar perfil →
        </Link>
      ),
    },
    {
      title: 'Publicá tu primera oferta o búsqueda',
      desc: 'Ofrecé tu servicio o publicá lo que estás buscando para empezar a conectar.',
      done: step2Done,
      cta: (
        <Link
          href="/publicar"
          className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          Publicar →
        </Link>
      ),
    },
    {
      title: 'Explorá las publicaciones',
      desc: 'Descubrí lo que hay disponible en Labu.',
      done: step3Done,
      cta: (
        <button
          onClick={handleExplorar}
          disabled={pending}
          className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300 disabled:opacity-50"
        >
          {pending ? 'Cargando...' : 'Explorar →'}
        </button>
      ),
    },
  ]

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-blue-900/50 bg-blue-950/40">
      {/* Cabecera */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Primeros pasos en Labu</p>
          <p className="mt-0.5 text-xs text-zinc-400">{totalDone} de 3 completados</p>
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-surface-2 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-surface-2"
        >
          {open ? 'Ocultar' : 'Ver pasos'}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="px-4 pb-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Lista de pasos */}
      {open && (
        <div className="flex flex-col gap-3 border-t border-surface-2 px-4 py-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              {step.done ? (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-900/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-emerald-400"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-surface-3 text-xs font-semibold text-zinc-500">
                  {i + 1}
                </div>
              )}

              <div className="min-w-0 flex-1 pt-0.5">
                <p className={`text-sm font-medium leading-tight ${step.done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                  {step.title}
                </p>
                {!step.done && (
                  <>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">{step.desc}</p>
                    <div className="mt-2">{step.cta}</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
