'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LoginPromptModal from '@/components/auth/LoginPromptModal'

export default function FloatingPublishMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

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

  // En mensajes taparía el campo para escribir (en desktop el chat ya no es pantalla completa)
  if (pathname === '/publicar' || pathname === '/mensajes' || pathname.startsWith('/mensajes/')) return null

  const svgTool = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  )
  const svgSearch = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )

  const menuOptions = isLoggedIn ? (
    <>
      <Link
        href="/publicar?tipo=oferta"
        onClick={() => setOpen(false)}
        className="flex items-center gap-2.5 rounded-full border border-green-800/60 bg-green-900/80 px-4 py-2.5 text-sm font-semibold text-green-300 shadow-lg backdrop-blur-sm transition-colors hover:bg-green-900"
      >
        {svgTool}
        Publicar mi servicio
      </Link>
      <Link
        href="/publicar?tipo=requerimiento"
        onClick={() => setOpen(false)}
        className="flex items-center gap-2.5 rounded-full border border-blue-800/60 bg-blue-900/80 px-4 py-2.5 text-sm font-semibold text-blue-300 shadow-lg backdrop-blur-sm transition-colors hover:bg-blue-900"
      >
        {svgSearch}
        Publicar una búsqueda
      </Link>
    </>
  ) : (
    <>
      <button
        type="button"
        onClick={() => { setOpen(false); setModalOpen(true) }}
        className="flex items-center gap-2.5 rounded-full border border-green-800/60 bg-green-900/80 px-4 py-2.5 text-sm font-semibold text-green-300 shadow-lg backdrop-blur-sm transition-colors hover:bg-green-900"
      >
        {svgTool}
        Publicar mi servicio
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setModalOpen(true) }}
        className="flex items-center gap-2.5 rounded-full border border-blue-800/60 bg-blue-900/80 px-4 py-2.5 text-sm font-semibold text-blue-300 shadow-lg backdrop-blur-sm transition-colors hover:bg-blue-900"
      >
        {svgSearch}
        Publicar una búsqueda
      </button>
    </>
  )

  const mainButton = (
    <div className="relative h-14 w-14">
      <div
        className="absolute rounded-full"
        style={{
          inset: '-3px',
          background: 'conic-gradient(from 0deg, #1e40af 0deg, #3b82f6 80deg, #bfdbfe 150deg, #ffffff 180deg, #bfdbfe 210deg, #3b82f6 280deg, #1e40af 360deg)',
          animation: 'spin-border 3s linear infinite',
        }}
      />
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Publicar"
        className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-500"
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

  return (
    <>
      {/* Wrapper con display:contents para que el ref funcione en ambas versiones */}
      <div ref={ref} style={{ display: 'contents' }}>
        {/* Mobile: posicionado sobre la barra flotante — safe area + margen barra + gap */}
        <div
          className="fixed right-4 z-20 flex flex-col items-end gap-2 md:hidden"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}
        >
          {open && <div className="mb-1 flex flex-col gap-2">{menuOptions}</div>}
          {mainButton}
        </div>

        {/* Desktop: posición original cerca del borde inferior */}
        <div className="fixed bottom-6 right-4 z-20 hidden flex-col items-end gap-2 md:flex">
          {open && <div className="mb-1 flex flex-col gap-2">{menuOptions}</div>}
          {mainButton}
        </div>
      </div>

      <LoginPromptModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
