'use client'

import { useActionState } from 'react'
import { solicitarVerificacion } from '@/app/actions/verificacion'

type Props = { userId: string }

const init = { error: null as string | null, ok: false }

export default function VerificacionForm({ userId }: Props) {
  const [state, action, pending] = useActionState(solicitarVerificacion, init)

  if (state.ok) {
    return (
      <p className="text-sm text-zinc-500">
        Solicitud enviada. La revisamos a la brevedad.
      </p>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="user_id" value={userId} />

      <div>
        <label className="mb-1 block text-sm text-zinc-600">
          Foto de tu DNI (frente o dorso)
        </label>
        <input
          type="file"
          name="documento"
          accept="image/*,.pdf"
          required
          className="block w-full text-sm text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
        />
        <p className="mt-1 text-xs text-zinc-400">Máximo 5MB · JPG, PNG o PDF</p>
      </div>

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-40"
      >
        {pending ? 'Enviando...' : 'Enviar verificación'}
      </button>
    </form>
  )
}
