'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { avatarBg } from '@/lib/avatar'
import type { ConversacionResumen } from '@/lib/conversacion'

// Lista minimalista: con quién hablás y qué fue lo último. El "sobre qué publicación"
// queda en el header del chat, no se repite acá.

type Props = {
  initialConversaciones: ConversacionResumen[]
  currentUserId: string
  // Desktop (/mensajes estilo WhatsApp): chat abierto en la columna derecha y callback para
  // abrir otro sin navegar. En mobile cada fila sigue siendo un link a /mensajes/[id].
  seleccionada?: string | null
  onSeleccionar?: (conversationId: string) => void
  // Filtro por nombre del contacto (buscador de la columna en desktop)
  filtro?: string
}

const esDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches

// "ahora", "hace 5 min", "hace 2h", "ayer", "lun 10", "10 oct"
function horaRelativa(iso: string): string {
  const fecha = new Date(iso)
  const ahora = new Date()
  const mins  = Math.floor((ahora.getTime() - fecha.getTime()) / 60000)
  if (mins < 1)  return 'ahora'
  if (mins < 60) return `hace ${mins} min`

  const inicioHoy  = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const inicioAyer = new Date(inicioHoy.getTime() - 86400000)
  if (fecha >= inicioHoy)  return `hace ${Math.floor(mins / 60)}h`
  if (fecha >= inicioAyer) return 'ayer'
  if (ahora.getTime() - fecha.getTime() < 7 * 86400000) {
    const dia = fecha.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')
    return `${dia} ${fecha.getDate()}`
  }
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '')
}

// true recién en el navegador: la hora relativa depende del reloj y la zona horaria del
// usuario, si la calculara el servidor (UTC) podría mostrar "ayer" para un mensaje de hoy
const sinSuscripcion = () => () => {}
function useEnNavegador() {
  return useSyncExternalStore(sinSuscripcion, () => true, () => false)
}

export default function ConversacionList({ initialConversaciones, currentUserId, seleccionada = null, onSeleccionar, filtro = '' }: Props) {
  const [conversaciones, setConversaciones] = useState(initialConversaciones)
  const enNavegador = useEnNavegador()

  // El chat abierto, leído desde el callback de Realtime sin re-suscribirse
  const seleccionadaRef = useRef(seleccionada)
  useEffect(() => { seleccionadaRef.current = seleccionada }, [seleccionada])

  // Realtime — patrón del proyecto: client dentro del effect, setAuth, cancelled, canal único
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | undefined
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)

      channel = supabase
        .channel(`mensajes-lista-${currentUserId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const nuevo = payload.new as {
            conversation_id: string
            content: string
            created_at: string
            read: boolean
            sender_id: string
            receiver_id: string
          }
          if (nuevo.sender_id !== currentUserId && nuevo.receiver_id !== currentUserId) return

          setConversaciones(prev => {
            const idx = prev.findIndex(c => c.conversation_id === nuevo.conversation_id)
            if (idx === -1) return prev

            const updated = [...prev]
            const [conv] = updated.splice(idx, 1)
            // Recibido en el chat que está abierto al lado = ya se está leyendo
            const recibido = nuevo.receiver_id === currentUserId && nuevo.conversation_id !== seleccionadaRef.current
            return [{
              ...conv,
              content: nuevo.content,
              created_at: nuevo.created_at,
              read: nuevo.read,
              sender_id: nuevo.sender_id,
              receiver_id: nuevo.receiver_id,
              unread: recibido ? conv.unread + 1 : conv.unread,
            }, ...updated]
          })
        })
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [currentUserId])

  if (conversaciones.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-zinc-400">
        No tenés conversaciones todavía.
      </p>
    )
  }

  const nombreDe = (conv: ConversacionResumen) => {
    const otro = conv.sender_id === currentUserId ? conv.receiver : conv.sender
    return otro?.first_name || otro?.username || 'Usuario'
  }
  const termino = filtro.trim().toLowerCase()
  const visibles = termino ? conversaciones.filter(c => nombreDe(c).toLowerCase().includes(termino)) : conversaciones

  function abrir(e: React.MouseEvent, conversationId: string) {
    // Al abrirla deja de tener no leídos (abrir el chat los marca como leídos en la base)
    setConversaciones(prev => prev.map(c => c.conversation_id === conversationId ? { ...c, unread: 0 } : c))
    if (onSeleccionar && esDesktop()) {
      e.preventDefault()
      onSeleccionar(conversationId)
    }
  }

  if (visibles.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-zinc-500">No hay conversaciones con &ldquo;{filtro.trim()}&rdquo;.</p>
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#171717]">
      <ul className="divide-y divide-[#2a2a2a]">
        {visibles.map(conv => {
          const otro    = conv.sender_id === currentUserId ? conv.receiver : conv.sender
          const otroId  = conv.sender_id === currentUserId ? conv.receiver_id : conv.sender_id
          const nombre  = nombreDe(conv)
          const tieneNoLeidos = conv.unread > 0
          const activa  = conv.conversation_id === seleccionada

          return (
            <li key={conv.conversation_id}>
              <Link
                href={`/mensajes/${conv.conversation_id}`}
                onClick={e => abrir(e, conv.conversation_id)}
                aria-current={activa ? 'true' : undefined}
                className={`flex items-center gap-3 border-l-2 px-4 py-3.5 transition-colors ${
                  activa ? 'border-blue-500 bg-blue-500/10' : 'border-transparent hover:bg-white/5'
                }`}
              >
                {otro?.avatar_url ? (
                  <Image src={otro.avatar_url} width={48} height={48} sizes="48px" alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white ${avatarBg(otro?.username, otro?.first_name, otroId)}`}>
                    {nombre[0].toUpperCase()}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={`truncate text-[15px] ${tieneNoLeidos ? 'font-semibold text-white' : 'font-medium text-zinc-200'}`}>
                      {nombre}
                    </p>
                    <span className={`shrink-0 text-xs ${tieneNoLeidos ? 'font-medium text-blue-400' : 'text-zinc-500'}`}>
                      {enNavegador ? horaRelativa(conv.created_at) : ''}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-3">
                    <p className={`truncate text-sm ${tieneNoLeidos ? 'text-zinc-200' : 'text-zinc-400'}`}>
                      {conv.sender_id === currentUserId && <span className="text-zinc-500">Vos: </span>}
                      {conv.content}
                    </p>
                    {tieneNoLeidos && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                        {conv.unread > 9 ? '9+' : conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
