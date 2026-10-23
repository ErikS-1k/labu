'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type ToastItem = {
  id: string
  message: string
  type: 'success' | 'error' | 'warning'
  visible: boolean
}

const MESSAGES: Record<string, { message: string; type: ToastItem['type'] }> = {
  bienvenido:           { message: '¡Bienvenido a Labu! Tu cuenta fue creada con éxito.', type: 'success' },
  publicacion_creada:   { message: '¡Tu publicación fue creada correctamente!',            type: 'success' },
  publicacion_editada:  { message: 'Los cambios fueron guardados.',                        type: 'success' },
  publicacion_eliminada:{ message: 'Tu publicación fue eliminada.',                        type: 'success' },
  email_actualizado:    { message: 'Tu email quedó actualizado.',                           type: 'success' },
}

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const searchParams = useSearchParams()
  const pathname     = usePathname()
  const router       = useRouter()

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
  }, [])

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type, visible: false }])
    // Trigger enter animation on next frame
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: true } : t))
    }))
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  // Mecanismo 1: URL param ?toast=clave
  useEffect(() => {
    const key = searchParams.get('toast')
    if (!key) return
    const data = MESSAGES[key]
    if (data) addToast(data.message, data.type)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('toast')
    router.replace(`${pathname}${params.toString() ? '?' + params.toString() : ''}`)
  }, [searchParams, pathname, router, addToast])

  // Mecanismo 2: custom event desde client components
  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastItem['type'] }>).detail
      addToast(message, type)
    }
    window.addEventListener('labu:toast', handler)
    return () => window.removeEventListener('labu:toast', handler)
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm md:w-80 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl transition-all duration-300 ${
            toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          } ${
            toast.type === 'success' ? 'border-green-800/60 bg-green-950 text-green-200' :
            toast.type === 'error'   ? 'border-red-800/60 bg-red-950 text-red-200' :
                                       'border-yellow-800/60 bg-yellow-950 text-yellow-200'
          }`}
        >
          <p className="flex-1 text-sm leading-snug">{toast.message}</p>
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-current"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
