'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { avatarBg } from '@/lib/avatar'

type Conversacion = {
  conversation_id: string
  content: string
  created_at: string
  read: boolean
  sender_id: string
  receiver_id: string
  sender: { username: string | null; first_name: string | null; headline: string | null } | null
  receiver: { username: string | null; first_name: string | null; headline: string | null } | null
}

type Props = {
  initialConversaciones: Conversacion[]
  currentUserId: string
}

export default function ConversacionList({ initialConversaciones, currentUserId }: Props) {
  const [conversaciones, setConversaciones] = useState(initialConversaciones)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('mensajes-lista')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
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
            return [{
              ...conv,
              content: nuevo.content,
              created_at: nuevo.created_at,
              read: nuevo.read,
              sender_id: nuevo.sender_id,
              receiver_id: nuevo.receiver_id,
            }, ...updated]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  if (conversaciones.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-zinc-400">
        No tenés conversaciones todavía.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {conversaciones.map(conv => {
        const otro = conv.sender_id === currentUserId ? conv.receiver : conv.sender
        const otroId = conv.sender_id === currentUserId ? conv.receiver_id : conv.sender_id
        const nombre = otro?.first_name ?? otro?.username ?? 'Usuario'
        const headline = otro?.headline ?? null
        const noLeido = !conv.read && conv.receiver_id === currentUserId

        return (
          <Link
            key={conv.conversation_id}
            href={`/mensajes/${conv.conversation_id}`}
            className="flex items-start gap-3 rounded-xl border border-surface-2 bg-surface-1 p-4 transition-shadow hover:shadow-sm"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarBg(otro?.username, otro?.first_name, otroId)}`}>
              {nombre[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={`truncate text-sm font-medium ${noLeido ? 'text-white' : 'text-zinc-300'}`}>
                  {nombre}
                </p>
                {noLeido && <span className="h-2 w-2 shrink-0 rounded-full bg-white" />}
              </div>
              {headline && (
                <p className="truncate text-xs text-zinc-500">{headline}</p>
              )}
              <p className="mt-0.5 truncate text-sm text-zinc-400">{conv.content}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
