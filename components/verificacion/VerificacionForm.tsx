'use client'

import { useActionState, useRef, useState } from 'react'
import { solicitarVerificacion } from '@/app/actions/verificacion'

type Props = { userId: string }

const init = { error: null as string | null, ok: false }

export default function VerificacionForm({ userId }: Props) {
  const [state, action, pending] = useActionState(solicitarVerificacion, init)
  const [archivo, setArchivo] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  if (state.ok) {
    return <p className="text-sm text-zinc-500">Solicitud enviada. La revisamos a la brevedad.</p>
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="user_id" value={userId} />

      {/* Input real oculto */}
      <input
        ref={inputRef}
        type="file"
        name="documento"
        accept="image/*,.pdf"
        required
        className="hidden"
        onChange={e => setArchivo(e.target.files?.[0] ?? null)}
      />

      {!archivo ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          Solicitar verificación
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500 truncate">📎 {archivo.name}</p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
            >
              {pending ? 'Enviando...' : 'Enviar verificación'}
            </button>
            <button
              type="button"
              onClick={() => { setArchivo(null); if (inputRef.current) inputRef.current.value = '' }}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  )
}
