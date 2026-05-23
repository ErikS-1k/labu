'use client'

import { useActionState, useState } from 'react'
import { calificar } from '@/app/actions/ratings'

type Props = {
  postId: string
  toUserId: string
  toUserName: string
}

const init = { error: null as string | null, ok: false }

export default function RatingForm({ postId, toUserId, toUserName }: Props) {
  const [state, action, pending] = useActionState(calificar, init)
  const [score, setScore] = useState(0)
  const [hover, setHover] = useState(0)

  if (state.ok) {
    return (
      <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
        Calificación enviada. ¡Gracias!
      </p>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="post_id"    value={postId} />
      <input type="hidden" name="to_user_id" value={toUserId} />
      <input type="hidden" name="score"      value={score} />

      <p className="text-sm font-medium text-zinc-700">
        Calificá a <span className="font-semibold">{toUserName}</span>
      </p>

      {/* Estrellas */}
      <div className="flex gap-1" role="group" aria-label="Puntuación">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className={`text-3xl transition-colors ${
              n <= (hover || score) ? 'text-yellow-400' : 'text-zinc-200'
            }`}
          >
            ★
          </button>
        ))}
      </div>

      {/* Comentario */}
      <textarea
        name="comment"
        rows={3}
        placeholder="Contá tu experiencia (opcional)..."
        className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 resize-none"
      />

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || score === 0}
        className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-40"
      >
        {pending ? 'Enviando...' : 'Enviar calificación'}
      </button>
    </form>
  )
}
