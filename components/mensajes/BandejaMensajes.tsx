'use client'

import { useEffect, useState, useTransition } from 'react'
import ConversacionList from './ConversacionList'
import ConversacionChat from './ConversacionChat'
import { useUnreadMessages } from './UnreadMessagesProvider'
import { abrirConversacion } from '@/app/actions/mensajes'
import PageHeader from '@/components/ui/PageHeader'
import type { ChatData, ConversacionResumen } from '@/lib/conversacion'

// Bandeja de mensajes.
//   Desktop (lg+): estilo WhatsApp. Lista (30%) | chat (70%), ambas con scroll propio.
//                  Tocar una conversación la abre a la derecha sin cambiar la URL.
//   Mobile:        igual que siempre. /mensajes = solo la lista; /mensajes/[id] = chat a pantalla completa.
//
// enRutaChat: true cuando se entra por /mensajes/[id] (en mobile solo se ve el chat).

type Props = {
  conversaciones: ConversacionResumen[]
  currentUserId: string
  chatInicial?: ChatData | null
  enRutaChat?: boolean
}

function IconChat() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

export default function BandejaMensajes({ conversaciones, currentUserId, chatInicial = null, enRutaChat = false }: Props) {
  const [seleccion, setSeleccion] = useState<string | null>(chatInicial?.conversationId ?? null)
  const [chat, setChat]           = useState<ChatData | null>(chatInicial)
  const [error, setError]         = useState(false)
  const [busqueda, setBusqueda]   = useState('')
  const [cargando, startTransition] = useTransition()
  const { setConversacionAbierta } = useUnreadMessages()

  // Avisarle al provider qué chat está abierto (sus mensajes no cuentan como no leídos)
  useEffect(() => {
    setConversacionAbierta(seleccion)
    return () => setConversacionAbierta(null)
  }, [seleccion, setConversacionAbierta])

  function seleccionar(conversationId: string) {
    if (conversationId === seleccion) return
    setSeleccion(conversationId)
    setError(false)
    startTransition(async () => {
      // Siempre se pide fresco: trae los mensajes nuevos y los marca como leídos
      const datos = await abrirConversacion(conversationId)
      if (!datos) { setError(true); setChat(null); return }
      setChat(datos)
    })
  }

  return (
    <div className="lg:flex lg:h-dvh">
      {/* ── Lista ── */}
      <aside className={`${enRutaChat ? 'hidden' : 'block'} mx-auto max-w-xl px-4 py-8 lg:mx-0 border-[#2a2a2a] lg:flex lg:w-[30%] lg:min-w-[300px] lg:max-w-none lg:shrink-0 lg:flex-col lg:border-r lg:p-0`}>
        <div className="lg:px-4 lg:pb-3 lg:pt-6">
          {/* Tablet (md): el encabezado de siempre. Desktop: título compacto de la columna */}
          <div className="lg:hidden"><PageHeader title="Mensajes" subtitle="Tus conversaciones activas" /></div>
          <h1 className="hidden font-serif text-2xl font-medium text-white lg:block">Mensajes</h1>
          {/* Buscar por nombre de contacto (solo desktop) */}
          <input
            id="buscar-contacto"
            type="search"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre…"
            aria-label="Buscar conversación por nombre"
            className="mt-4 hidden w-full rounded-xl border border-[#2a2a2a] bg-[#111] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600 lg:block"
          />
        </div>
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-4 lg:pb-6">
          <ConversacionList
            initialConversaciones={conversaciones}
            currentUserId={currentUserId}
            seleccionada={seleccion}
            onSeleccionar={seleccionar}
            filtro={busqueda}
          />
        </div>
      </aside>

      {/* ── Chat ──
          Mobile: solo en /mensajes/[id], a pantalla completa (tapa sidebar, BottomNav y botón flotante).
          Desktop: columna derecha dentro del layout normal. */}
      <section
        className={`${enRutaChat ? 'fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#0a0a0a]' : 'hidden'} lg:static lg:z-auto lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:bg-transparent`}
      >
        {cargando ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-surface-2 border-t-zinc-400" aria-label="Cargando conversación" />
          </div>
        ) : chat && seleccion === chat.conversationId ? (
          <ConversacionChat key={chat.conversationId} currentUserId={currentUserId} {...chat} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
              <IconChat />
            </span>
            <p className="max-w-xs text-[15px] text-zinc-400">
              {error ? 'No pudimos abrir la conversación. Probá de nuevo.' : 'Seleccioná una conversación para empezar a chatear'}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
