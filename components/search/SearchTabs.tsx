'use client'

import { useSearchParams } from 'next/navigation'
import { PARAM, parseFiltros, type TipoPost } from '@/lib/search'
import { useSearchNavigation } from './SearchNavigation'

const TABS: { value: TipoPost; label: string }[] = [
  { value: 'oferta',        label: 'Servicios ofrecidos' },
  { value: 'requerimiento', label: 'Búsquedas de trabajo' },
]

export default function SearchTabs() {
  const searchParams = useSearchParams()
  const { aplicar } = useSearchNavigation()
  const { tipo } = parseFiltros(searchParams)

  return (
    <div className="flex gap-2">
      {TABS.map(t => (
        <button
          key={t.value}
          type="button"
          onClick={() => aplicar({ [PARAM.tipo]: t.value })}
          className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors ${
            tipo === t.value
              ? 'bg-blue-500 text-white'
              : 'border border-surface-2 text-zinc-400 hover:bg-surface-2 hover:text-zinc-200'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
