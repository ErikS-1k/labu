'use client'

import { useState } from 'react'
import Link from 'next/link'
import LoginPromptModal from '@/components/auth/LoginPromptModal'

const btnCls = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90'

function IconMas() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

// CTA del estado sin resultados: publicar un requerimiento con el texto buscado como título.
// Sin sesión, /publicar redirige a /login y se pierde la búsqueda → se muestra el modal de registro.
export default function PublicarBusquedaCTA({ q, logueado }: { q: string; logueado: boolean }) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const href = `/publicar?tipo=requerimiento&titulo=${encodeURIComponent(q)}`

  return (
    <div className="flex flex-col items-center">
      <p className="font-semibold text-white">¿No encontrás lo que necesitás?</p>
      <p className="mt-1.5 text-sm text-zinc-400">Publicá tu búsqueda y esperá a que alguien te contacte.</p>

      <div className="mt-5">
        {logueado ? (
          <Link href={href} className={btnCls}>
            <IconMas />
            Publicar lo que busco
          </Link>
        ) : (
          <button type="button" onClick={() => setModalAbierto(true)} className={btnCls}>
            <IconMas />
            Publicar lo que busco
          </button>
        )}
      </div>

      <LoginPromptModal open={modalAbierto} onClose={() => setModalAbierto(false)} />
    </div>
  )
}
