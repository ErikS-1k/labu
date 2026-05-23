'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { MODALIDADES } from '@/lib/constants'

interface Props {
  paramPrefix?: string  // ej: 'of_' o 'req_' para el panel; '' para feeds individuales
  preserveParams?: string[]  // params a preservar en la URL al filtrar (ej: ['of', 'req'])
}

export default function FeedFilters({ paramPrefix = '', preserveParams = [] }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const busquedaKey  = `${paramPrefix}busqueda`
  const categoriaKey = `${paramPrefix}categoria`
  const modalidadKey = `${paramPrefix}modalidad`

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data      = new FormData(e.currentTarget)
    const busqueda  = (data.get('busqueda')  as string).trim()
    const categoria = (data.get('categoria') as string).trim()
    router.push(`${pathname}?${buildParams({ [busquedaKey]: busqueda, [categoriaKey]: categoria })}`)
  }

  const inputClass = 'rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600'

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            name="busqueda"
            defaultValue={searchParams.get(busquedaKey) ?? ''}
            placeholder="Buscar en títulos y descripciones..."
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            Buscar
          </button>
        </div>
        <input
          name="categoria"
          defaultValue={searchParams.get(categoriaKey) ?? ''}
          placeholder="Filtrar por categoría (ej: Plomería, Diseño web...)"
          className={inputClass}
        />
      </form>

      <select
        value={searchParams.get(modalidadKey) ?? ''}
        onChange={e => updateModalidad(e.target.value)}
        className={inputClass}
      >
        <option value="">Todas las modalidades</option>
        {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
    </div>
  )
}
