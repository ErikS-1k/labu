'use client'

import { useRef, useState } from 'react'
import { eliminarPost } from '@/app/actions/posts'

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
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)

  function confirmar() {
    setOpen(false)
    formRef.current?.requestSubmit()
  }

  return (
    <>
      <form ref={formRef} action={eliminarPost}>
        <input type="hidden" name="post_id"    value={postId} />
        <input type="hidden" name="type"       value={type} />
        {returnTo && <input type="hidden" name="return_to" value={returnTo} />}
        <button type="button" onClick={() => setOpen(true)} className={className}>
          {label}
        </button>
      </form>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-surface-2 bg-surface-0 p-6">
            <h2 className="mb-2 text-base font-bold text-white">¿Eliminar esta publicación?</h2>
            <p className="mb-6 text-sm leading-relaxed text-zinc-400">
              Se borrará permanentemente de la plataforma, incluyendo el historial de todos los usuarios que interactuaron con ella. Esta acción no se puede deshacer.
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
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
