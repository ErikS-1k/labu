'use client'

import { useActionState, useRef, useState } from 'react'
import { solicitarVerificacion } from '@/app/actions/verificacion'
import { useProgress } from '@/lib/useProgress'

type Props = { userId: string }

const init = { error: null as string | null, ok: false }

export default function VerificacionForm({ userId }: Props) {
  const [state, action, pending] = useActionState(solicitarVerificacion, init)
  useProgress(pending)
  const [archivo, setArchivo] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Éxito ──────────────────────────────────────────────────────────────────
  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className="text-base font-semibold text-white">¡Solicitud enviada!</p>
        <p className="text-sm text-blue-100">La revisamos en las próximas 24 a 48 horas.</p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col items-center gap-4">
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
        /* ── Botón principal ── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full max-w-xs rounded-xl bg-white px-6 py-3 text-base font-bold text-blue-600 transition-colors hover:bg-blue-50 active:bg-blue-100"
        >
          Subir mi DNI
        </button>
      ) : (
        /* ── Archivo seleccionado ── */
        <div className="flex w-full max-w-xs flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
            <span className="truncate text-sm text-white">{archivo.name}</span>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-white px-6 py-3 text-base font-bold text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50"
          >
            {pending ? 'Enviando...' : 'Confirmar y enviar'}
          </button>

          <button
            type="button"
            onClick={() => { setArchivo(null); if (inputRef.current) inputRef.current.value = '' }}
            className="text-sm text-blue-200 underline transition-colors hover:text-white"
          >
            Cambiar archivo
          </button>
        </div>
      )}

      {state.error && (
        <p className="text-sm font-medium text-red-300">{state.error}</p>
      )}
    </form>
  )
}
