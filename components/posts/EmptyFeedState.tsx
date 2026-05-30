'use client'

import { useState } from 'react'
import Link from 'next/link'
import LoginPromptModal from '@/components/auth/LoginPromptModal'

type Props = {
  busqueda?: string
  tipo?: string
  isLoggedIn: boolean
  hayFiltros: boolean
}

const btnCls = 'rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200'

function PublishButton({
  href,
  label,
  isLoggedIn,
  onGuestClick,
}: {
  href: string
  label: string
  isLoggedIn: boolean
  onGuestClick: () => void
}) {
  if (isLoggedIn) return <Link href={href} className={btnCls}>{label}</Link>
  return <button type="button" onClick={onGuestClick} className={btnCls}>{label}</button>
}

function Card({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-surface-2 bg-surface-1 px-6 py-10 text-center">
      <p className="font-medium text-white">{titulo}</p>
      <p className="mt-1 mb-5 text-sm text-zinc-400">{subtitulo}</p>
      {children}
    </div>
  )
}

export default function EmptyFeedState({ busqueda, tipo, isLoggedIn, hayFiltros }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const abrirModal = () => setModalOpen(true)

  const esTodos         = !tipo || tipo === 'todos'
  const esRequerimiento = tipo === 'requerimiento'

  let contenido: React.ReactNode

  if (busqueda && esTodos) {
    // Tab "Todos": dos bloques separados con mensajes cruzados
    contenido = (
      <div className="flex flex-col gap-3">
        <Card
          titulo={`No encontramos ${busqueda} ofreciendo sus servicios.`}
          subtitulo={`¿Necesitás un ${busqueda}? Publicá tu búsqueda y que te encuentren.`}
        >
          <PublishButton href="/publicar?tipo=requerimiento" label="Publicar una búsqueda" isLoggedIn={isLoggedIn} onGuestClick={abrirModal} />
        </Card>
        <Card
          titulo={`Nadie está buscando ${busqueda} todavía.`}
          subtitulo={`¿Sos ${busqueda}? Publicá tu servicio ahora y que te contraten.`}
        >
          <PublishButton href="/publicar?tipo=oferta" label="Publicar mi servicio" isLoggedIn={isLoggedIn} onGuestClick={abrirModal} />
        </Card>
      </div>
    )
  } else if (busqueda && esRequerimiento) {
    // Tab "Necesita contratar" sin resultados → cross-sell a oferta
    contenido = (
      <Card
        titulo={`Nadie está buscando ${busqueda} todavía.`}
        subtitulo={`¿Sos ${busqueda}? Publicá tu servicio ahora y que te contraten.`}
      >
        <PublishButton href="/publicar?tipo=oferta" label="Publicar mi servicio" isLoggedIn={isLoggedIn} onGuestClick={abrirModal} />
      </Card>
    )
  } else if (busqueda) {
    // Tab "Ofrece sus servicios" sin resultados → cross-sell a requerimiento
    contenido = (
      <Card
        titulo={`No encontramos ${busqueda} ofreciendo sus servicios.`}
        subtitulo={`¿Necesitás un ${busqueda}? Publicá tu búsqueda y que te encuentren.`}
      >
        <PublishButton href="/publicar?tipo=requerimiento" label="Publicar una búsqueda" isLoggedIn={isLoggedIn} onGuestClick={abrirModal} />
      </Card>
    )
  } else if (!hayFiltros) {
    // Sin ningún filtro — feed completamente vacío
    contenido = (
      <Card titulo="Todavía no hay publicaciones." subtitulo="¡Sé el primero en publicar!">
        <div className="flex justify-center gap-2">
          <PublishButton href="/publicar?tipo=oferta" label="Publicar mi servicio" isLoggedIn={isLoggedIn} onGuestClick={abrirModal} />
          <PublishButton href="/publicar?tipo=requerimiento" label="Publicar una búsqueda" isLoggedIn={isLoggedIn} onGuestClick={abrirModal} />
        </div>
      </Card>
    )
  } else {
    // Hay filtros activos (categoría, modalidad) pero sin busqueda
    contenido = (
      <Card titulo="No encontramos resultados." subtitulo="Probá con otros filtros.">
        <PublishButton
          href={esRequerimiento ? '/publicar?tipo=requerimiento' : '/publicar?tipo=oferta'}
          label={esRequerimiento ? 'Publicar una búsqueda' : 'Publicar mi servicio'}
          isLoggedIn={isLoggedIn}
          onGuestClick={abrirModal}
        />
      </Card>
    )
  }

  return (
    <>
      {contenido}
      <LoginPromptModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
