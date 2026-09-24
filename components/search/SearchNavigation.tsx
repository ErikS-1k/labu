'use client'

import { createContext, useContext, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PARAM } from '@/lib/search'

// Estado compartido de /buscar: el texto del input, la navegación (URL = fuente de verdad
// de la búsqueda) y si hay una búsqueda cargando (para mostrar el spinner en los resultados).

type Cambios = Record<string, string | null>

type SearchNavigationValue = {
  query: string
  isPending: boolean
  // Aplica cambios a los query params (null = borrar). Si no se pasa q, usa lo escrito en el input.
  aplicar: (cambios: Cambios) => void
  // Actualiza el input y busca con debounce de 300ms
  escribir: (valor: string) => void
}

const SearchNavigationContext = createContext<SearchNavigationValue | null>(null)

export function useSearchNavigation() {
  const ctx = useContext(SearchNavigationContext)
  if (!ctx) throw new Error('useSearchNavigation debe usarse dentro de <SearchNavigationProvider>')
  return ctx
}

export function SearchNavigationProvider({ children }: { children: React.ReactNode }) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const urlQ = searchParams.get(PARAM.q) ?? ''
  const [query, setQuery]           = useState(urlQ)
  const [urlQPrevia, setUrlQPrevia] = useState(urlQ)
  const [ultimaQ, setUltimaQ]       = useState(urlQ) // última q que pusimos nosotros en la URL

  // Si la q de la URL cambió por algo externo (ej. buscador del header), sincronizar el input
  if (urlQ !== urlQPrevia) {
    setUrlQPrevia(urlQ)
    if (urlQ !== ultimaQ) {
      setQuery(urlQ)
      setUltimaQ(urlQ)
    }
  }

  // sincronizarInput = false cuando el cambio viene del propio input (no pisar lo que se escribe,
  // ej. un espacio al final mientras el usuario sigue tipeando)
  function navegar(cambios: Cambios, sincronizarInput: boolean) {
    clearTimeout(debounceRef.current)
    const params = new URLSearchParams(searchParams.toString())
    params.delete(PARAM.pagina)

    const todos: Cambios = { [PARAM.q]: query.trim(), ...cambios }
    for (const [k, v] of Object.entries(todos)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }

    const q = params.get(PARAM.q) ?? ''
    setUltimaQ(q)
    if (sincronizarInput && q !== query.trim()) setQuery(q)

    const qs = params.toString()
    startTransition(() => {
      router.replace(`/buscar${qs ? `?${qs}` : ''}`, { scroll: false })
    })
  }

  function aplicar(cambios: Cambios) {
    navegar(cambios, true)
  }

  function escribir(valor: string) {
    setQuery(valor)
    clearTimeout(debounceRef.current)
    const limpio = valor.trim()
    if (!limpio) {
      navegar({ [PARAM.q]: null }, false)
      return
    }
    debounceRef.current = setTimeout(() => navegar({ [PARAM.q]: limpio }, false), 300)
  }

  return (
    <SearchNavigationContext.Provider value={{ query, isPending, aplicar, escribir }}>
      {children}
    </SearchNavigationContext.Provider>
  )
}

// Envuelve los resultados: mientras carga una búsqueda nueva los atenúa y muestra un spinner
export function SearchPendingArea({ children }: { children: React.ReactNode }) {
  const { isPending } = useSearchNavigation()
  return (
    <div className="relative" aria-busy={isPending}>
      {isPending && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-10">
          <span className="flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#171717] px-4 py-2 text-xs text-zinc-300 shadow-lg">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
            Buscando…
          </span>
        </div>
      )}
      <div className={`transition-opacity ${isPending ? 'opacity-40' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  )
}
