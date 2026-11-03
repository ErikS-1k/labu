'use client'

import { useState } from 'react'
import Link from 'next/link'
import LoginPromptModal from '@/components/auth/LoginPromptModal'

type Tipo = 'oferta' | 'requerimiento'

// Con sesión: link a /publicar. Sin sesión: abre el modal "Necesitás una cuenta".
function PublicarLink({ tipo, isLoggedIn, className, children }: {
  tipo: Tipo
  isLoggedIn: boolean
  className: string
  children: React.ReactNode
}) {
  const [modal, setModal] = useState(false)
  if (isLoggedIn) {
    return <Link href={`/publicar?tipo=${tipo}`} className={className}>{children}</Link>
  }
  return (
    <>
      <button type="button" onClick={() => setModal(true)} className={className}>{children}</button>
      <LoginPromptModal open={modal} onClose={() => setModal(false)} />
    </>
  )
}

function IconTool({ size = 22 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  )
}

function IconSearch({ size = 22 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

const ESTILO = {
  oferta: {
    card:  'border-green-800/50 bg-green-900/20 hover:bg-green-900/40',
    texto: 'text-green-400',
    boton: 'bg-green-600 hover:bg-green-700',
    label: 'Publicar mi servicio',
  },
  requerimiento: {
    card:  'border-blue-800/50 bg-blue-900/20 hover:bg-blue-900/40',
    texto: 'text-blue-400',
    boton: 'bg-blue-600 hover:bg-blue-700',
    label: 'Publicar una búsqueda',
  },
} as const

// Card teñida "Publicar mi servicio" (verde) / "Publicar una búsqueda" (azul)
export function PublicarCTA({ tipo, isLoggedIn }: { tipo: Tipo; isLoggedIn: boolean }) {
  const e = ESTILO[tipo]
  return (
    <PublicarLink
      tipo={tipo}
      isLoggedIn={isLoggedIn}
      className={`flex w-full flex-col items-center gap-2 rounded-xl border px-4 py-5 text-center transition-colors ${e.card}`}
    >
      <span className={e.texto}>{tipo === 'oferta' ? <IconTool /> : <IconSearch />}</span>
      <span className={`text-sm font-semibold ${e.texto}`}>{e.label}</span>
    </PublicarLink>
  )
}

// Estado vacío de una columna del panel en desktop
export function ColumnaVacia({ tipo, isLoggedIn }: { tipo: Tipo; isLoggedIn: boolean }) {
  const e = ESTILO[tipo]
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#2a2a2a] bg-surface-1 px-6 py-12 text-center">
      <span className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${tipo === 'oferta' ? 'bg-green-500/15' : 'bg-blue-500/15'} ${e.texto}`}>
        {tipo === 'oferta' ? <IconTool size={26} /> : <IconSearch size={26} />}
      </span>
      <p className="max-w-[260px] text-sm leading-relaxed text-zinc-300">
        {tipo === 'oferta'
          ? 'Todavía no hay servicios publicados. ¿Querés ofrecer el tuyo?'
          : 'Todavía no hay búsquedas publicadas. ¿Sos el primero en publicar?'}
      </p>
      <PublicarLink
        tipo={tipo}
        isLoggedIn={isLoggedIn}
        className={`mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors ${e.boton}`}
      >
        {e.label}
      </PublicarLink>
    </div>
  )
}
