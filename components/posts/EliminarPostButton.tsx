'use client'

import { useRef } from 'react'
import { eliminarPost } from '@/app/actions/posts'

export default function EliminarPostButton({ postId, type }: { postId: string; type: string }) {
  const formRef = useRef<HTMLFormElement>(null)

  function handleClick() {
    if (confirm('¿Seguro que querés eliminar esta publicación? Esta acción no se puede deshacer.')) {
      formRef.current?.requestSubmit()
    }
  }

  return (
    <form ref={formRef} action={eliminarPost}>
      <input type="hidden" name="post_id" value={postId} />
      <input type="hidden" name="type"    value={type} />
      <button
        type="button"
        onClick={handleClick}
        className="mt-4 w-full rounded-xl border border-red-200 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50"
      >
        Eliminar publicación
      </button>
    </form>
  )
}
