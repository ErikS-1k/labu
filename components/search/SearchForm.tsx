'use client'

import { PARAM } from '@/lib/search'
import { useSearchNavigation } from './SearchNavigation'

// Input de /buscar: busca en tiempo real (debounce 300ms) sin necesidad de Enter
export default function SearchForm() {
  const { query, escribir, aplicar } = useSearchNavigation()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    aplicar({ [PARAM.q]: query.trim() || null })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        value={query}
        onChange={e => escribir(e.target.value)}
        placeholder="Buscá por nombre, rubro o zona..."
        autoFocus
        className="flex-1 rounded-xl border border-[#2a2a2a] bg-[#111] px-4 py-2.5 text-sm outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
      />
      <button
        type="submit"
        className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Buscar
      </button>
    </form>
  )
}
