'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchForm({ initialQ }: { initialQ: string }) {
  const [q, setQ] = useState(initialQ)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = q.trim()
    router.push(trimmed ? `/buscar?q=${encodeURIComponent(trimmed)}` : '/buscar')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
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
