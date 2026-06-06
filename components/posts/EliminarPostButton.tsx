'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { eliminarPost } from '@/app/actions/posts'
import { showToast } from '@/lib/toast'
import { useProgress } from '@/lib/useProgress'

export default function EliminarPostButton({
  postId,
  type,
  label = 'Eliminar publicación',
  className = 'mt-4 w-full rounded-xl border border-red-200 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50',
  returnTo,
}: {
  postId: string
  type: string
  label?: string
  className?: string
  returnTo?: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  useProgress(isPending)
  const router = useRouter()

  function confirmar() {
    setOpen(false)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('post_id', postId)
      fd.append('type', type)
      if (returnTo) fd.append('return_to', returnTo)
      await eliminarPost(fd)
      showToast('Tu publicación fue eliminada.')
      if (returnTo) router.refresh()
    })
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={isPending} className={className}>
        {isPending ? 'Eliminando...' : label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-surface-2 bg-surface-0 p-6">
            <h2 className="mb-2 text-base font-bold text-white">¿Estás seguro?</h2>
            <p className="mb-6 text-sm leading-relaxed text-zinc-400">
              Eliminar esta publicacion implica que se borrará permanentemente de la plataforma, incluyendo el historial de todos los usuarios que interactuaron con ella. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-surface-2 py-2 text-sm text-zinc-300 transition-colors hover:bg-surface-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmar}
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
