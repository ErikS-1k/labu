'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function FloatingPublishMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        aria-label="Publicar"
        className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg transition-colors hover:bg-zinc-200 md:bottom-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </Link>
    )
  }

  return (
    <div ref={ref} className="fixed bottom-20 right-4 z-20 flex flex-col items-end gap-2 md:bottom-6">

      {/* Opciones — aparecen encima del botón */}
      {open && (
        <div className="mb-1 flex flex-col gap-2">
          <Link
            href="/publicar?tipo=oferta"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-full border border-green-800/60 bg-green-900/80 px-4 py-2.5 text-sm font-semibold text-green-300 shadow-lg backdrop-blur-sm transition-colors hover:bg-green-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            Publicar mi servicio
          </Link>
          <Link
            href="/publicar?tipo=requerimiento"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-full border border-blue-800/60 bg-blue-900/80 px-4 py-2.5 text-sm font-semibold text-blue-300 shadow-lg backdrop-blur-sm transition-colors hover:bg-blue-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Publicar una búsqueda
          </Link>
        </div>
      )}

      {/* Botón principal */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Publicar"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg transition-colors hover:bg-zinc-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
        >
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  )
}
