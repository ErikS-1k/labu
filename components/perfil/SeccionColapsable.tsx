'use client'

import { useId, useState } from 'react'

// Sección del perfil con header clickeable que expande/colapsa su contenido.
// No es exclusivo: cada sección maneja su propio estado, varias pueden estar abiertas.
// La animación usa grid-template-rows 0fr → 1fr: anima la altura real del contenido
// sin necesidad de fijar un max-height arbitrario (que corta textos largos).
export default function SeccionColapsable({
  titulo,
  defaultAbierta = false,
  children,
}: {
  titulo: string
  defaultAbierta?: boolean
  children: React.ReactNode
}) {
  const [abierta, setAbierta] = useState(defaultAbierta)
  const id = useId()

  return (
    <section className="overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#171717]">
      <h2>
        <button
          type="button"
          onClick={() => setAbierta(a => !a)}
          aria-expanded={abierta}
          aria-controls={id}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5"
        >
          <span className="text-lg font-semibold text-white">{titulo}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            className={`shrink-0 text-zinc-400 transition-transform duration-300 ${abierta ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </h2>

      <div
        id={id}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          abierta ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        {/* inert: con la sección cerrada su contenido no recibe foco ni lo lee el lector de pantalla */}
        <div className="overflow-hidden" inert={!abierta}>
          <div className="px-5 pb-5">{children}</div>
        </div>
      </div>
    </section>
  )
}
