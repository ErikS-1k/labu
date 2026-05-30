'use client'

import Link from 'next/link'

export default function LoginPromptModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-surface-2 bg-surface-0 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-2 text-base font-bold text-white">Necesitás una cuenta</h2>
        <p className="mb-6 text-sm leading-relaxed text-zinc-400">
          Para hacer esto necesitás una cuenta en Labu. Es gratis y tarda menos de un minuto.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/registro"
            className="w-full rounded-lg bg-white py-2.5 text-center text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            Crear cuenta
          </Link>
          <Link
            href="/login"
            className="w-full rounded-lg border border-surface-2 py-2.5 text-center text-sm text-zinc-300 transition-colors hover:bg-surface-2"
          >
            Ya tengo cuenta, iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
