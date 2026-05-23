'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HeaderSearchBar() {
  const [q, setQ] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = q.trim()
    router.push(trimmed ? `/buscar?q=${encodeURIComponent(trimmed)}` : '/buscar')
    setQ('')
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <input
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Buscar en Labu..."
        className="w-full rounded-lg border border-surface-2 bg-surface-2 px-3 py-1.5 text-sm outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
      />
    </form>
  )
}
