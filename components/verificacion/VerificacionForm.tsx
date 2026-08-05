'use client'

import { useActionState, useRef, useState } from 'react'
import { solicitarVerificacion } from '@/app/actions/verificacion'
import { useProgress } from '@/lib/useProgress'

type Props = { userId: string }

const init = { error: null as string | null, ok: false }

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
const MAX_BYTES = 10 * 1024 * 1024

export default function VerificacionForm({ userId }: Props) {
  const [state, action, pending] = useActionState(solicitarVerificacion, init)
  useProgress(pending)
  const [archivo, setArchivo]       = useState<File | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setClientError(null)

    if (file.size > MAX_BYTES) {
      setClientError('El archivo es muy pesado. El máximo es 10MB.')
      e.target.value = ''
      return
    }

    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
                   /\.(heic|heif)$/i.test(file.name)
    const isValid = ALLOWED_TYPES.includes(file.type) || isHeic

    if (!isValid) {
      setClientError('El formato no está soportado. Usá JPG, PNG, HEIC, WEBP o PDF.')
      e.target.value = ''
      return
    }

    let finalFile = file

    if (isHeic) {
      setIsConverting(true)
      try {
        const { default: heic2any } = await import('heic2any')
        const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
        const blob = Array.isArray(result) ? result[0] : result
        finalFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
        const dt = new DataTransfer()
        dt.items.add(finalFile)
        if (inputRef.current) inputRef.current.files = dt.files
      } catch {
        setClientError('No se pudo convertir la foto. Guardala como JPG desde tu galería e intentá de nuevo.')
        e.target.value = ''
        setIsConverting(false)
        return
      }
      setIsConverting(false)
    }

    setArchivo(finalFile)
  }

  return (
    <form action={action} className="flex flex-col items-center gap-4">
      <input type="hidden" name="user_id" value={userId} />

      {/* Input real oculto */}
      <input
        ref={inputRef}
        type="file"
        name="documento"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,.pdf"
        required
        className="hidden"
        onChange={handleFileChange}
      />

      {isConverting && (
        <p className="text-sm text-blue-200">Convirtiendo foto...</p>
      )}

      {!archivo ? (
        /* ── Botón principal ── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isConverting}
          className="w-full max-w-xs rounded-xl bg-white px-6 py-3 text-base font-bold text-blue-600 transition-colors hover:bg-blue-50 active:bg-blue-100 disabled:opacity-50"
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
            onClick={() => { setArchivo(null); setClientError(null); if (inputRef.current) inputRef.current.value = '' }}
            className="text-sm text-blue-200 underline transition-colors hover:text-white"
          >
            Cambiar archivo
          </button>
        </div>
      )}

      {(clientError || state.error) && (
        <p className="text-sm font-medium text-red-300">{clientError ?? state.error}</p>
      )}
    </form>
  )
}
