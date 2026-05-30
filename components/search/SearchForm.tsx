'use client'

import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SearchForm({ initialQ }: { initialQ: string }) {
  const [q, setQ] = useState(initialQ)
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function buildUrl(query: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (query) params.set('q', query)
    else params.delete('q')
    return `/buscar${params.toString() ? '?' + params.toString() : ''}`
  }

  function handleChange(value: string) {
    setQ(value)
    clearTimeout(debounceRef.current)
    if (!value.trim()) {
      router.replace(buildUrl(''))
      return
    }
    debounceRef.current = setTimeout(() => {
      router.replace(buildUrl(value.trim()))
    }, 300)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearTimeout(debounceRef.current)
    router.replace(buildUrl(q.trim()))
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        value={q}
        onChange={e => handleChange(e.target.value)}
        placeholder="Buscá por nombre, rubro o zona..."
        autoFocus
        className="flex-1 rounded-lg border border-surface-2 bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
      />
      <button
        type="submit"
        className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
      >
        Buscar
      </button>
    </form>
  )
}
