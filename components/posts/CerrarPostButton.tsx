'use client'

import { useRef, useState } from 'react'
import { cerrarPost } from '@/app/actions/posts'

export default function CerrarPostButton({
  postId,
  type,
}: {
  postId: string
  type: 'oferta' | 'requerimiento'
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)

  function confirmar() {
    setOpen(false)
    formRef.current?.requestSubmit()
  }

  const descripcion = type === 'oferta'
    ? 'Nadie más podrá solicitar este servicio, pero la publicación se mantendrá en tu historial y en el de todos los usuarios que interactuaron con ella.'
    : 'Nadie más podrá postularse, pero la publicación se mantendrá en tu historial y en el de todos los usuarios que interactuaron con ella.'

  return (
    <>
      <form ref={formRef} action={cerrarPost}>
        <input type="hidden" name="post_id" value={postId} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-surface-2"
        >
          Cerrar
        </button>
      </form>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-surface-2 bg-surface-0 p-6">
            <h2 className="mb-2 text-base font-bold text-white">¿Cerrar esta publicación?</h2>
            <p className="mb-6 text-sm leading-relaxed text-zinc-400">{descripcion}</p>
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
                className="flex-1 rounded-lg bg-zinc-700 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-600"
              >
                Cerrar publicación
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
