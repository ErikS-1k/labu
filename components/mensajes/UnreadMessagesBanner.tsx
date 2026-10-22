'use client'

import Link from 'next/link'
import { useUnreadMessages } from './UnreadMessagesProvider'

// Banner de /panel: aparece solo con mensajes sin leer y se actualiza en tiempo real
// (el conteo viene de UnreadMessagesProvider, que tiene la suscripción Realtime)
export default function UnreadMessagesBanner() {
  const { count } = useUnreadMessages()
  if (count <= 0) return null

  return (
    <Link
      href="/mensajes"
      className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-600/30 bg-blue-600/10 p-4 transition-colors hover:bg-blue-600/15"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </span>
      <p className="min-w-0 flex-1 text-sm font-semibold text-white">
        Tenés {count} {count === 1 ? 'mensaje sin leer' : 'mensajes sin leer'}
      </p>
      <span className="shrink-0 text-sm font-semibold text-blue-400">
        Ver mensajes →
      </span>
    </Link>
  )
}
