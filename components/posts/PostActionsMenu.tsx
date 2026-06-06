'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cerrarPost, eliminarPost } from '@/app/actions/posts'
import { showToast } from '@/lib/toast'
import { useProgress } from '@/lib/useProgress'

export default function PostActionsMenu({
  postId,
  type,
  isActive,
}: {
  postId: string
  type: string
  isActive: boolean
}) {
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [cerrarOpen,  setCerrarOpen]  = useState(false)
  const [eliminarOpen, setEliminarOpen] = useState(false)
  const [isPending, startTransition]  = useTransition()
  useProgress(isPending)
  const router    = useRouter()
  const menuRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  function confirmarDesactivar() {
    setCerrarOpen(false)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('post_id', postId)
      await cerrarPost(fd)
      showToast('Publicación desactivada.')
    })
  }

  function confirmarEliminar() {
    setEliminarOpen(false)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('post_id', postId)
      fd.append('type', type)
      fd.append('return_to', '/mi-actividad')
      await eliminarPost(fd)
      showToast('Tu publicación fue eliminada.')
      router.refresh()
    })
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          disabled={isPending}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg leading-none text-zinc-400 transition-colors hover:bg-surface-2 hover:text-white disabled:opacity-40"
          aria-label="Opciones"
        >
          ···
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 z-20 min-w-[150px] rounded-xl border border-surface-2 bg-surface-1 py-1 shadow-xl">
            <Link
              href={`/editar/${postId}`}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-surface-2 hover:text-white"
            >
              Editar
            </Link>
            {isActive && (
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setCerrarOpen(true) }}
                className="block w-full px-4 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-surface-2 hover:text-white"
              >
                Desactivar
              </button>
            )}
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setEliminarOpen(true) }}
              className="block w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-900/20"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Modal: Desactivar */}
      {cerrarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-surface-2 bg-surface-0 p-6">
            <h2 className="mb-2 text-base font-bold text-white">¿Desactivar esta publicación?</h2>
            <p className="mb-6 text-sm leading-relaxed text-zinc-400">
              Nadie más podrá interactuar con ella, pero se mantendrá en tu historial.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCerrarOpen(false)}
                className="flex-1 rounded-lg border border-surface-2 py-2 text-sm text-zinc-300 transition-colors hover:bg-surface-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarDesactivar}
                className="flex-1 rounded-lg bg-zinc-700 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-600"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Eliminar */}
      {eliminarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-surface-2 bg-surface-0 p-6">
            <h2 className="mb-2 text-base font-bold text-white">¿Estás seguro?</h2>
            <p className="mb-6 text-sm leading-relaxed text-zinc-400">
              Eliminar esta publicacion implica que se borrará permanentemente de la plataforma, incluyendo el historial de todos los usuarios que interactuaron con ella. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEliminarOpen(false)}
                className="flex-1 rounded-lg border border-surface-2 py-2 text-sm text-zinc-300 transition-colors hover:bg-surface-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
