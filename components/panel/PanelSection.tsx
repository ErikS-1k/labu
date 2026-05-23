'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Props {
  title: string
  subtitle: string
  openParam: string  // ej: 'of' o 'req'
  isOpen: boolean
  children: React.ReactNode
}

export default function PanelSection({ title, subtitle, openParam, isOpen, children }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  function toggle() {
    const params = new URLSearchParams(searchParams.toString())
    if (isOpen) {
      params.delete(openParam)
      // Limpiar los filtros de esta sección al cerrar
      for (const key of [`${openParam}_busqueda`, `${openParam}_categoria`, `${openParam}_modalidad`]) {
        params.delete(key)
      }
    } else {
      params.set(openParam, '1')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className={`flex flex-col rounded-2xl border transition-all duration-200 ${
      isOpen ? 'border-surface-2 bg-surface-1' : 'border-surface-2 bg-surface-1 hover:border-zinc-600'
    }`}>
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <div>
          <p className="text-lg font-semibold text-white">{title}</p>
          <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>
        </div>
        <span className={`shrink-0 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-surface-2 px-6 py-5">
          {children}
        </div>
      )}
    </div>
  )
}
