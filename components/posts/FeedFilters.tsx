'use client'

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

  function buildParams(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    for (const key of preserveParams) {
      const v = searchParams.get(key)
      if (v) params.set(key, v)
    }
    // Preservar todos los params con otros prefijos
    for (const [k, v] of searchParams.entries()) {
      if (!k.startsWith(paramPrefix) && !preserveParams.includes(k)) params.set(k, v)
    }
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    return params.toString()
  }

  function updateModalidad(value: string) {
    router.push(`${pathname}?${buildParams({ [modalidadKey]: value })}`)
  }

  function updateTipo(value: string) {
    router.push(`${pathname}?${buildParams({ [tipoKey]: value })}`)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data      = new FormData(e.currentTarget)
    const busqueda  = (data.get('busqueda')  as string).trim()
    const categoria = (data.get('categoria') as string).trim()
    router.push(`${pathname}?${buildParams({ [busquedaKey]: busqueda, [categoriaKey]: categoria })}`)
  }

  const inputClass = 'rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600'

  const tipoActual = searchParams.get(tipoKey) ?? ''

  const tabClass = (value: string) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      tipoActual === value
        ? 'bg-white text-black'
        : 'bg-surface-2 text-zinc-300 hover:bg-surface-3 hover:text-white'
    }`

  return (
    <div className="flex flex-col gap-3">
      {showTypeTabs && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => updateTipo('')}               className={tabClass('')}>Todos</button>
          <button type="button" onClick={() => updateTipo('oferta')}        className={tabClass('oferta')}>Ofrece sus servicios</button>
          <button type="button" onClick={() => updateTipo('requerimiento')} className={tabClass('requerimiento')}>Necesita contratar</button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSubmit} className="contents">
          <div className="relative min-w-[160px] flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              name="busqueda"
              defaultValue={searchParams.get(busquedaKey) ?? ''}
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
