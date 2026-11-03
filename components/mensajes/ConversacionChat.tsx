'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { enviarMensaje, marcarConversacionLeida } from '@/app/actions/mensajes'
import { avatarBg } from '@/lib/avatar'

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
  receiverAvatarUrl?: string | null
  receiverUsername?: string | null
  postTitle?: string | null
  backHref?: string
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
  receiverAvatarUrl = null,
  receiverUsername = null,
  postTitle = null,
  backHref = '/mensajes',
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

  // Suscripción Realtime — escucha mensajes nuevos de esta conversación.
  // Los que llegan con el chat abierto se marcan como leídos: al instante si la app está
  // visible, o apenas el usuario vuelve a ella (pestaña en segundo plano, celular bloqueado).
  useEffect(() => {
    let pendienteLeer = false
    let timerLeer: ReturnType<typeof setTimeout> | undefined

    function marcarLeidos() {
      pendienteLeer = false
      clearTimeout(timerLeer)
      // Pequeño debounce: una ráfaga de mensajes se marca con una sola llamada
      timerLeer = setTimeout(() => {
        timerLeer = undefined
        marcarConversacionLeida(conversationId)
      }, 250)
    }

    function alRecibir() {
      if (document.visibilityState === 'visible') marcarLeidos()
      else pendienteLeer = true
    }

    function alCambiarVisibilidad() {
      if (document.visibilityState === 'visible' && pendienteLeer) marcarLeidos()
    }
    document.addEventListener('visibilitychange', alCambiarVisibilidad)

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
          if (nuevo.sender_id !== currentUserId) alRecibir()
        }
      )
      .subscribe()

    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
      // Si quedó una marca pendiente (el usuario salió del chat enseguida), hacerla igual
      if (timerLeer) {
        clearTimeout(timerLeer)
        marcarConversacionLeida(conversationId)
      }
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

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
    <div className="flex h-full min-h-0 flex-col">
      {/* Encabezado sticky — respeta el notch/Dynamic Island con safe-area-inset-top */}
      <header
        className="shrink-0 border-b border-[#2a2a2a] bg-[#0a0a0a]/95 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-2 py-2.5">
          {/* En desktop la lista está al lado (BandejaMensajes): la flecha solo hace falta en mobile
              y en /mensajes/nuevo, que sigue siendo pantalla completa */}
          <Link
            href={backHref}
            aria-label="Volver"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-surface-2 hover:text-white ${isNew ? '' : 'lg:hidden'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>

          <Link
            href={`/perfil/${receiverId}`}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-1 pr-2 transition-colors hover:bg-surface-1"
          >
            {receiverAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={receiverAvatarUrl}
                alt={receiverName}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarBg(receiverUsername, receiverName, receiverId)}`}>
                {receiverName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-tight text-white">{receiverName}</p>
              {receiverHeadline && (
                <p className="mt-0.5 truncate text-xs text-zinc-400">{receiverHeadline}</p>
              )}
            </div>
          </Link>
        </div>

        {/* Contexto: publicación sobre la que se habla */}
        {postId && postTitle && (
          <div className="mx-auto max-w-3xl px-4 pb-2">
            <Link
              href={`/post/${postId}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#171717] px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
            >
              <span className="shrink-0">Sobre:</span>
              <span className="truncate text-zinc-300">{postTitle}</span>
            </Link>
          </div>
        )}
      </header>

      {/* Mensajes */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-3xl px-4 py-4">
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
                  ? 'bg-blue-500 text-white'
                  : 'bg-surface-2 text-zinc-200'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
        </div>
      </div>

      {/* Input fijo abajo — respeta la barra de inicio del iPhone con safe-area-inset-bottom */}
      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-[#2a2a2a] bg-[#0a0a0a]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2.5">
          <input
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Escribí un mensaje..."
            disabled={sending}
            enterKeyHint="send"
            className="min-w-0 flex-1 rounded-full border border-[#2a2a2a] bg-[#111] px-4 py-2.5 text-base text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600"
          />
          <button
            type="submit"
            aria-label="Enviar"
            disabled={!content.trim() || sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white transition-opacity disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
