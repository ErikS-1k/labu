'use client'

import { useRef } from 'react'
import { cerrarPost } from '@/app/actions/posts'

export default function CerrarPostButton({ postId }: { postId: string }) {
  const formRef = useRef<HTMLFormElement>(null)

  function handleClick() {
    if (confirm('¿Cerrar esta publicación? Va a dejar de aparecer en los feeds, pero seguirá visible en Mis publicaciones.')) {
      formRef.current?.requestSubmit()
    }
  }

  return (
    <form ref={formRef} action={cerrarPost}>
      <input type="hidden" name="post_id" value={postId} />
      <button
        type="button"
        onClick={handleClick}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-surface-2"
      >
        Cerrar
      </button>
    </form>
  )
}
