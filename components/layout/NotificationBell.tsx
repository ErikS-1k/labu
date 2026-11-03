'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { marcarNotificacionesLeidas, marcarTodasLeidas, obtenerNotificaciones } from '@/app/actions/notifications'
import { showToast } from '@/lib/toast'
import type { NotifItem } from '@/lib/notificaciones'
import NotificacionesList from '@/components/notificaciones/NotificacionesList'

// Campana de la barra lateral (solo desktop). No navega: abre un panel de 400px pegado al
// sidebar, sin cambiar la URL. En mobile la campana del header sigue yendo a /notificaciones.

function IconBell() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

export default function NotificationBell({ userId, initialCount = 0, onOpenChange }: {
  userId: string
  initialCount?: number
  // El sidebar se mantiene angosto mientras el panel está abierto (debe ser estable, ej. un setState)
  onOpenChange?: (abierto: boolean) => void
}) {
  const [unread, setUnread]   = useState(initialCount)
  const [abierto, setAbierto] = useState(false)
  const [items, setItems]     = useState<NotifItem[] | null>(null)
  const [cargando, startTransition] = useTransition()
  const pathname = usePathname()
  const router   = useRouter()
  const botonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // El callback de Realtime lee si el panel está abierto sin re-suscribirse
  const abiertoRef = useRef(false)
  useEffect(() => { abiertoRef.current = abierto }, [abierto])

  const enPagina = pathname === '/notificaciones'

  function cambiar(valor: boolean) {
    setAbierto(valor)
    onOpenChange?.(valor)
  }

  function cargar() {
    startTransition(async () => { setItems(await obtenerNotificaciones()) })
  }

  function toggle() {
    if (!abierto) cargar()
    cambiar(!abierto)
  }

  // Al navegar a otra pantalla, el panel se cierra
  const [pathPrevio, setPathPrevio] = useState(pathname)
  if (pathname !== pathPrevio) {
    setPathPrevio(pathname)
    if (abierto) { setAbierto(false); onOpenChange?.(false) }
  }

  // Cerrar con click/toque afuera o Escape
  useEffect(() => {
    if (!abierto) return
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || botonRef.current?.contains(t)) return
      setAbierto(false); onOpenChange?.(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setAbierto(false); onOpenChange?.(false); botonRef.current?.focus() }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [abierto, onOpenChange])

  // Realtime: notificación nueva → sube el badge; si el panel está abierto, se recarga la lista
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | undefined
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)

      channel = supabase
        .channel(`notif-bell-${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
          const notif = payload.new as { user_id: string }
          if (notif.user_id !== userId) return
          setUnread(c => c + 1)
          if (abiertoRef.current) obtenerNotificaciones().then(lista => { if (!cancelled) setItems(lista) })
        })
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [userId])

  // La pantalla completa /notificaciones marca todo como leído al entrar
  useEffect(() => {
    if (enPagina) setUnread(0)
  }, [enPagina])

  function tocar(n: NotifItem) {
    if (!n.read) {
      marcarNotificacionesLeidas(n.ids)
      setUnread(c => Math.max(0, c - n.ids.length))
      setItems(prev => prev?.map(x => (x.key === n.key ? { ...x, read: true } : x)) ?? prev)
    }
    cambiar(false)
    router.push(n.href)
  }

  async function marcarTodas() {
    setItems(prev => prev?.map(x => ({ ...x, read: true })) ?? prev)
    setUnread(0)
    await marcarTodasLeidas()
    showToast('Listo, no te queda nada sin leer.')
  }

  const hayNoLeidas = items?.some(n => !n.read) ?? false

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        onClick={toggle}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
          abierto || enPagina
            ? 'bg-surface-2 text-white'
            : 'text-zinc-400 hover:bg-surface-2 hover:text-white'
        }`}
      >
        <span className="relative shrink-0">
          <IconBell />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
        <span className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100 group-data-[expandido=true]:opacity-100">
          Notificaciones
        </span>
      </button>

      {/* Panel: fixed escapa del overflow-hidden del sidebar. Debajo de modales (z-95) y toasts (z-100). */}
      {abierto && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notificaciones"
          className="fixed inset-y-0 left-14 z-[60] flex w-[400px] max-w-[calc(100vw-3.5rem)] flex-col border-r border-[#2a2a2a] bg-surface-1 shadow-2xl shadow-black/40 transition-[opacity,transform] duration-200 ease-out starting:-translate-x-3 starting:opacity-0"
        >
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-6">
            <h2 className="font-serif text-2xl font-medium text-white">Notificaciones</h2>
            <div className="flex items-center gap-1">
              {hayNoLeidas && (
                <button type="button" onClick={marcarTodas} className="rounded-lg px-2 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-white/5 hover:text-blue-300">
                  Marcar todas como leídas
                </button>
              )}
              <button
                type="button"
                onClick={() => cambiar(false)}
                aria-label="Cerrar notificaciones"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#2a2a2a]">
            {items === null || (cargando && items.length === 0) ? (
              <div className="flex justify-center py-16">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-surface-2 border-t-zinc-400" aria-label="Cargando notificaciones" />
              </div>
            ) : (
              <NotificacionesList items={items} onTocar={tocar} />
            )}
          </div>
        </div>
      )}
    </>
  )
}
