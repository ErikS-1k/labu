'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Fuente única de verdad de los mensajes sin leer. Un solo canal Realtime alimenta:
//   - el badge de "Mensajes" en BottomNav y PanelSidebar (count + pulseKey para la animación)
//   - el banner de /panel (count)
//   - el toast global de mensaje nuevo (lo renderiza este mismo provider)

type UnreadMessagesValue = {
  count: number
  // Sube en 1 cada vez que llega un mensaje nuevo: se usa como `key` para reiniciar la animación
  pulseKey: number
  // Chat abierto sin cambiar la URL (columna derecha de /mensajes en desktop): sus mensajes
  // no se cuentan ni muestran toast, igual que cuando se está en /mensajes/[id]
  setConversacionAbierta: (id: string | null) => void
}

const UnreadMessagesContext = createContext<UnreadMessagesValue>({ count: 0, pulseKey: 0, setConversacionAbierta: () => {} })

export function useUnreadMessages() {
  return useContext(UnreadMessagesContext)
}

type MensajeToast = {
  conversationId: string
  remitente: string
  preview: string
}

type MensajeRow = {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
}

const DURACION_TOAST_MS = 6000

// Conteo real desde la base (RLS: cada usuario solo ve sus propios mensajes)
async function contarNoLeidos(userId: string): Promise<number | null> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('read', false)
  return error ? null : count
}

function recortar(texto: string, max = 55) {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  return limpio.length > max ? limpio.slice(0, max).trimEnd() + '…' : limpio
}

export function UnreadMessagesProvider({
  userId,
  initialCount,
  children,
}: {
  userId: string | null
  initialCount: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router   = useRouter()

  const [count, setCount]       = useState(initialCount)
  const [pulseKey, setPulseKey] = useState(0)
  const [toast, setToast]       = useState<MensajeToast | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Si el layout se vuelve a renderizar con otro conteo (router.refresh), adoptarlo
  const [initialPrevio, setInitialPrevio] = useState(initialCount)
  if (initialCount !== initialPrevio) {
    setInitialPrevio(initialCount)
    setCount(initialCount)
  }

  // pathname en un ref: el callback de Realtime lo lee sin re-suscribirse en cada navegación
  const pathnameRef = useRef(pathname)
  useEffect(() => { pathnameRef.current = pathname }, [pathname])

  const abiertaRef = useRef<string | null>(null)
  const setConversacionAbierta = useCallback((id: string | null) => { abiertaRef.current = id }, [])

  // Al navegar se re-cuenta: abrir un chat marca sus mensajes como leídos en el servidor
  useEffect(() => {
    if (!userId) return
    let cancelado = false
    contarNoLeidos(userId).then(n => { if (!cancelado && n != null) setCount(n) })
    return () => { cancelado = true }
  }, [pathname, userId])

  const cerrarToast = useCallback(() => {
    clearTimeout(toastTimer.current)
    setToast(null)
  }, [])

  // Realtime — patrón del proyecto: client dentro del effect, setAuth, cancelled, canal único
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | undefined
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)

      channel = supabase
        .channel(`unread-messages-${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
          const msg = payload.new as MensajeRow
          if (msg.receiver_id !== userId) return

          // Si está mirando esa conversación, ConversacionChat lo marca como leído al instante:
          // no se cuenta, no late el badge y no hay toast
          const enEseChat = pathnameRef.current === `/mensajes/${msg.conversation_id}` || abiertaRef.current === msg.conversation_id
          if (enEseChat && document.visibilityState === 'visible') return

          // Con la app en segundo plano sí cuenta: queda sin leer hasta que vuelva
          setCount(c => c + 1)
          setPulseKey(k => k + 1)

          if (enEseChat) return

          const { data: remitente } = await supabase
            .from('users').select('first_name, username').eq('id', msg.sender_id).single()
          if (cancelled) return

          clearTimeout(toastTimer.current)
          // Máximo 1 toast: el nuevo reemplaza al anterior
          setToast({
            conversationId: msg.conversation_id,
            remitente: remitente?.first_name || remitente?.username || 'Alguien',
            preview: recortar(msg.content),
          })
          toastTimer.current = setTimeout(() => setToast(null), DURACION_TOAST_MS)
        })
        // Un mensaje marcado como leído (en este u otro dispositivo) → re-contar
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
          const msg = payload.new as MensajeRow
          if (msg.receiver_id !== userId) return
          contarNoLeidos(userId).then(n => { if (!cancelled && n != null) setCount(n) })
        })
        .subscribe()
    })

    return () => {
      cancelled = true
      clearTimeout(toastTimer.current)
      if (channel) supabase.removeChannel(channel)
    }
  }, [userId])

  function abrirConversacion() {
    if (!toast) return
    const destino = `/mensajes/${toast.conversationId}`
    cerrarToast()
    router.push(destino)
  }

  return (
    <UnreadMessagesContext.Provider value={{ count, pulseKey, setConversacionAbierta }}>
      {children}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 z-[101] flex justify-center px-4 md:inset-x-auto md:right-4 md:justify-end md:px-0"
          style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
        >
          <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-surface-2 p-3 shadow-xl shadow-black/50 transition-[opacity,transform] duration-200 ease-out starting:-translate-y-2 starting:opacity-0">
            <button
              type="button"
              onClick={abrirConversacion}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{toast.remitente}</span>
                <span className="block truncate text-sm text-zinc-400">{toast.preview}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={abrirConversacion}
              className="shrink-0 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              Responder
            </button>
            <button
              type="button"
              onClick={cerrarToast}
              aria-label="Cerrar"
              className="shrink-0 rounded-full p-1 text-zinc-500 transition-colors hover:bg-surface-3 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </UnreadMessagesContext.Provider>
  )
}
