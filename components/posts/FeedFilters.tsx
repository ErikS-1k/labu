'use client'

import { useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { MODALIDADES } from '@/lib/constants'

interface Props {
  paramPrefix?: string
  preserveParams?: string[]
  showTypeTabs?: boolean
}

export default function FeedFilters({ paramPrefix = '', preserveParams = [], showTypeTabs = false }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const busquedaKey  = `${paramPrefix}busqueda`
  const categoriaKey = `${paramPrefix}categoria`
  const modalidadKey = `${paramPrefix}modalidad`
  const tipoKey      = `${paramPrefix}tipo`

  const [busquedaValue, setBusquedaValue] = useState(searchParams.get(busquedaKey) ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function buildParams(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    return params.toString()
  }

  function handleBusquedaChange(value: string) {
    setBusquedaValue(value)
    clearTimeout(debounceRef.current)
    if (!value.trim()) {
      router.replace(`${pathname}?${buildParams({ [busquedaKey]: '' })}`)
      return
    }
    debounceRef.current = setTimeout(() => {
      router.replace(`${pathname}?${buildParams({ [busquedaKey]: value.trim() })}`)
    }, 300)
  }

  function updateModalidad(value: string) {
    router.replace(`${pathname}?${buildParams({ [modalidadKey]: value })}`)
  }

  function updateTipo(value: string) {
    router.replace(`${pathname}?${buildParams({ [tipoKey]: value })}`)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    clearTimeout(debounceRef.current)
    const categoria = (new FormData(e.currentTarget).get('categoria') as string ?? '').trim()
    router.replace(`${pathname}?${buildParams({ [busquedaKey]: busquedaValue.trim(), [categoriaKey]: categoria })}`)
  }

  const inputClass = 'rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600'

  const tipoActual = searchParams.get(tipoKey) ?? ''

  const tabClass = (value: string) =>
    `inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      tipoActual === value
        ? 'bg-white text-black'
        : 'bg-surface-2 text-zinc-300 hover:bg-surface-3 hover:text-white'
    }`

  return (
    <div className="flex flex-col gap-3">
      {showTypeTabs && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => updateTipo('')} className={tabClass('')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Todos
          </button>
          <button type="button" onClick={() => updateTipo('oferta')} className={tabClass('oferta')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            Ofrece sus servicios
          </button>
          <button type="button" onClick={() => updateTipo('requerimiento')} className={tabClass('requerimiento')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            Necesita contratar
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSubmit} className="contents">
          <div className="relative min-w-[160px] flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={busquedaValue}
              onChange={e => handleBusquedaChange(e.target.value)}
              placeholder="Buscar..."
              className={`${inputClass} w-full pl-8`}
            />
          </div>
          <input
            name="categoria"
            defaultValue={searchParams.get(categoriaKey) ?? ''}
            placeholder="Categoría"
            className={`${inputClass} w-36`}
          />
          <button type="submit" className="sr-only">Buscar</button>
        </form>
        <select
          value={searchParams.get(modalidadKey) ?? ''}
          onChange={e => updateModalidad(e.target.value)}
          className={`${inputClass} w-auto`}
        >
          <option value="">Modalidad</option>
          {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
    </div>
  )
}
