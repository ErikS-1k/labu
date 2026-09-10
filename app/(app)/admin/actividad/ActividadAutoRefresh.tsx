'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ActividadAutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs text-green-400">
      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
      Auto-actualiza cada 30s
    </span>
  )
}
