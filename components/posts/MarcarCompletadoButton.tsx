'use client'

import { useTransition } from 'react'
import { marcarCompletado } from '@/app/actions/posts'
import { showToast } from '@/lib/toast'
import { useProgress } from '@/lib/useProgress'

export default function MarcarCompletadoButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition()
  useProgress(isPending)

  function handleClick() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('post_id', postId)
      await marcarCompletado(fd)
      showToast('¡Trabajo terminado! No te olvides de dejar tu opinión.')
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg border border-surface-2 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-surface-2 disabled:opacity-50"
    >
      {isPending ? 'Guardando...' : 'Marcar como terminado'}
    </button>
  )
}
