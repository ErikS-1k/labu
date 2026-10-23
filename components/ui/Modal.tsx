'use client'

import { useEffect, useRef } from 'react'

// Modal centrado con el estilo de los modales existentes (PostActionsMenu).
// Cierra con Escape o tocando el fondo; al abrir pone el foco en el primer campo o botón.
export default function Modal({
  titulo,
  onClose,
  children,
}: {
  titulo: string
  onClose: () => void
  children: React.ReactNode
}) {
  const panelRef   = useRef<HTMLDivElement>(null)
  // onClose en un ref: si el padre pasa una función nueva en cada render, el efecto
  // no se vuelve a ejecutar (y el foco no salta al primer campo mientras se escribe)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus()
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCloseRef.current() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-surface-2 bg-surface-0 p-6 shadow-xl shadow-black/50"
      >
        <h2 className="mb-4 text-base font-bold text-white">{titulo}</h2>
        {children}
      </div>
    </div>
  )
}
