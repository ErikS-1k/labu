'use client'

import { useState } from 'react'
import LoginPromptModal from '@/components/auth/LoginPromptModal'

export default function GuestPostAction({
  type,
}: {
  type: 'oferta' | 'requerimiento'
}) {
  const [open, setOpen] = useState(false)
  const label = type === 'oferta' ? 'Solicitar contacto' : 'Enviar solicitud'

  return (
    <>
      <div className="mt-4 rounded-xl border border-surface-2 bg-surface-1 p-5">
        <p className="mb-3 text-sm text-zinc-400">
          {type === 'oferta'
            ? 'Iniciá sesión para solicitar contacto con quien ofrece el servicio.'
            : 'Iniciá sesión para enviar tu solicitud.'}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
        >
          {label}
        </button>
      </div>
      <LoginPromptModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
