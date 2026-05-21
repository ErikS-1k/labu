'use client'

import { useActionState } from 'react'
import { postularse } from '@/app/actions/applications'

type Props = {
  postId: string
  textoBoton?: string
  placeholder?: string
  mensajeOk?: string
}

const init = { error: null as string | null, ok: false }

export default function PostularseForm({
  postId,
  textoBoton = 'Postularse',
  placeholder = 'Contá brevemente por qué sos la persona indicada (opcional)...',
  mensajeOk = 'Postulación enviada. Te avisamos cuando el demandante la revise.',
}: Props) {
  const [state, action, pending] = useActionState(postularse, init)

  if (state.ok) {
    return (
      <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
        {mensajeOk}
      </p>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="post_id" value={postId} />
      <textarea
        name="message"
        rows={3}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
      />
      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
      >
        {pending ? 'Enviando...' : textoBoton}
      </button>
    </form>
  )
}
