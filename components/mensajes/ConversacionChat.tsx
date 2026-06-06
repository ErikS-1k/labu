'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { enviarMensaje } from '@/app/actions/mensajes'

type Mensaje = {
  id: string
  content: string
  sender_id: string
  created_at: string
}

type Props = {
  conversationId: string
  currentUserId: string
  receiverId: string
  postId: string | null
  initialMessages: Mensaje[]
  receiverName: string
  receiverHeadline?: string | null
  // true cuando todavía no existe en la DB — redirigir al enviar el primer mensaje
  isNew?: boolean
}

export default function ConversacionChat({
  conversationId,
  currentUserId,
  receiverId,
  postId,
  initialMessages,
  receiverName,
  receiverHeadline,
  isNew = false,
}: Props) {
  const [messages, setMessages] = useState<Mensaje[]>(initialMessages)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollInitialized = useRef(false)
  const router = useRouter()
  const supabase = createClient()

  // Scroll inicial instantáneo; luego solo si el usuario ya estaba al fondo
  useEffect(() => {
    if (!scrollInitialized.current) {
      bottomRef.current?.scrollIntoView()
      scrollInitialized.current = true
      return
    }
    const el = scrollRef.current
    if (!el) return
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    if (isAtBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Actualizar el badge del sidebar: re-fetch del layout para reflejar mensajes leídos
  useEffect(() => {
    router.refresh()
  }, [conversationId])

  // Suscripción Realtime — escucha mensajes nuevos de esta conversación
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const nuevo = payload.new as Mensaje & { conversation_id: string }
          if (nuevo.conversation_id !== conversationId) return
          setMessages(prev =>
            prev.some(m => m.id === nuevo.id) ? prev : [...prev, nuevo]
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || sending) return

    setSending(true)
    setContent('')

    const { error } = await enviarMensaje({
      conversationId,
      receiverId,
      postId,
      content: trimmed,
    })

    setSending(false)

    if (!error && isNew) {
      router.replace(`/mensajes/${conversationId}`)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Encabezado */}
      <div className="border-b border-zinc-200 px-4 py-3">
        <p className="font-semibold text-white">{receiverName}</p>
        {receiverHeadline && (
          <p className="truncate text-xs text-zinc-500">{receiverHeadline}</p>
        )}
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-400">
            Mandá el primer mensaje para iniciar la conversación.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                msg.sender_id === currentUserId
                  ? 'bg-white text-zinc-900'
                  : 'bg-zinc-100 text-zinc-800'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-3 border-t border-zinc-200 p-3">
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Escribí un mensaje..."
          disabled={sending}
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-3 text-base outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="rounded-lg bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
