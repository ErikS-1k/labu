'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { MODALIDADES } from '@/lib/constants'

export default function FeedFilters() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  function updateModalidad(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('modalidad', value)
    else params.delete('modalidad')
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data      = new FormData(e.currentTarget)
    const busqueda  = (data.get('busqueda')  as string).trim()
    const categoria = (data.get('categoria') as string).trim()

    const params = new URLSearchParams(searchParams.toString())
    busqueda  ? params.set('busqueda',  busqueda)  : params.delete('busqueda')
    categoria ? params.set('categoria', categoria) : params.delete('categoria')

    router.push(`${pathname}?${params.toString()}`)
  }

  const inputClass = 'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200'

  return (
    <div className="flex flex-col gap-3">
      {/* Búsqueda y categoría en un solo form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            name="busqueda"
            defaultValue={searchParams.get('busqueda') ?? ''}
            placeholder="Buscar en títulos y descripciones..."
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Buscar
          </button>
        </div>
        <input
          name="categoria"
          defaultValue={searchParams.get('categoria') ?? ''}
          placeholder="Filtrar por categoría (ej: Plomería, Diseño web...)"
          className={inputClass}
        />
      </form>

      {/* Modalidad — actualiza al instante */}
      <select
        value={searchParams.get('modalidad') ?? ''}
        onChange={e => updateModalidad(e.target.value)}
        className={inputClass}
      >
        <option value="">Todas las modalidades</option>
        {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
    </div>
  )
}
