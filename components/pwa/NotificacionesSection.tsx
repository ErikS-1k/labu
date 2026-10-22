'use client'

import { useEffect, useState } from 'react'
import { guardarPushSubscription, eliminarPushSubscription, verificarPushSubscription } from '@/app/actions/push'
import { showToast } from '@/lib/toast'

type PushState = 'loading' | 'unsupported' | 'default' | 'granted' | 'denied' | 'inconsistent'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const bytes = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i)
  }
  return bytes
}

function IconBell() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

export default function NotificacionesSection() {
  const [pushState, setPushState] = useState<PushState>('loading')
  const [pending, setPending]     = useState(false)

  useEffect(() => {
    async function detectState() {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setPushState('unsupported')
        return
      }

      const perm = Notification.permission
      if (perm === 'denied') { setPushState('denied'); return }
      if (perm === 'default') { setPushState('default'); return }

      // perm === 'granted' — verificar consistencia browser vs Supabase
      let localSub: PushSubscription | null = null
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg) localSub = await reg.pushManager.getSubscription()
      } catch (err) {
        console.error('[push] getSubscription:', err)
      }

      let dbHasSub = false
      try {
        dbHasSub = await verificarPushSubscription()
      } catch (err) {
        console.error('[push] verificarPushSubscription:', err)
      }

      setPushState((localSub && dbHasSub) ? 'granted' : 'inconsistent')
    }

    detectState()
  }, [])

  async function activar() {
    if (!('Notification' in window)) {
      showToast('Tu navegador no soporta notificaciones.')
      return
    }

    setPending(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm === 'denied') { setPushState('denied'); return }
      if (perm !== 'granted') return

      if (!('serviceWorker' in navigator)) {
        showToast('Tu navegador no soporta notificaciones push.')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        showToast('Error de configuración. Contactá al soporte.')
        return
      }

      let sub: PushSubscription
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
      } catch (err) {
        console.error('[push] pushManager.subscribe:', err)
        showToast('No se pudo suscribir a las notificaciones. Si estás en Safari, instalá la app en tu pantalla de inicio primero.')
        return
      }

      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      const { error } = await guardarPushSubscription(json)
      if (error) {
        showToast('No se pudo guardar la suscripción. Intentá de nuevo.')
        return
      }

      setPushState('granted')
      showToast('Notificaciones activadas correctamente.')
    } catch (err) {
      console.error('[push] activar:', err)
      showToast('Ocurrió un error inesperado. Probá de nuevo.')
    } finally {
      setPending(false)
    }
  }

  async function desactivar() {
    setPending(true)
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg) {
          const sub = await reg.pushManager.getSubscription()
          if (sub) {
            await sub.unsubscribe()
            await eliminarPushSubscription(sub.endpoint)
          }
        }
      }
      setPushState('default')
      showToast('Notificaciones desactivadas.')
    } catch (err) {
      console.error('[PUSH] desactivar error:', err)
      showToast('Ocurrió un error al desactivar las notificaciones.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">

      {/* Cargando */}
      {pushState === 'loading' && (
        <>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-zinc-800" />
            <div className="h-4 w-36 animate-pulse rounded bg-zinc-800" />
          </div>
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
          <div className="h-9 w-44 animate-pulse rounded-xl bg-zinc-800" />
        </>
      )}

      {/* Sin soporte */}
      {pushState === 'unsupported' && (
        <>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-500">
              <IconBell />
            </div>
            <h2 className="text-sm font-semibold text-white">Notificaciones</h2>
          </div>
          <p className="text-sm text-zinc-500">Tu navegador no soporta notificaciones push.</p>
        </>
      )}

      {/* Estado A — Sin permiso */}
      {pushState === 'default' && (
        <>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <IconBell />
            </div>
            <h2 className="text-sm font-semibold text-white">Notificaciones desactivadas</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Activá las notificaciones para enterarte cuando alguien te mande un mensaje o una solicitud.
          </p>
          <button
            type="button"
            onClick={activar}
            disabled={pending}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 sm:w-auto sm:self-start"
          >
            {pending ? 'Activando...' : 'Activar notificaciones'}
          </button>
        </>
      )}

      {/* Estado B — Activadas */}
      {pushState === 'granted' && (
        <>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <IconBell />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">Notificaciones activadas</h2>
              <svg className="h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
          <p className="text-sm text-zinc-500">Recibís alertas cuando te llegan mensajes o solicitudes.</p>
          <button
            type="button"
            onClick={desactivar}
            disabled={pending}
            className="w-full rounded-xl border border-[#2a2a2a] px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-60 sm:w-auto sm:self-start"
          >
            {pending ? 'Desactivando...' : 'Desactivar notificaciones'}
          </button>
        </>
      )}

      {/* Estado C — Bloqueadas */}
      {pushState === 'denied' && (
        <>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
              <IconBell />
            </div>
            <h2 className="text-sm font-semibold text-white">Notificaciones bloqueadas</h2>
          </div>
          <p className="text-sm text-zinc-500">
            Las notificaciones están bloqueadas en tu navegador. Para activarlas, tocá el ícono de candado en la barra de direcciones y permitilas manualmente.
          </p>
        </>
      )}

      {/* Estado D — Inconsistencia */}
      {pushState === 'inconsistent' && (
        <>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
              <IconBell />
            </div>
            <h2 className="text-sm font-semibold text-white">Reintentar activación</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Detectamos un problema con tu suscripción de notificaciones. Tocá para reintentar.
          </p>
          <button
            type="button"
            onClick={activar}
            disabled={pending}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 sm:w-auto sm:self-start"
          >
            {pending ? 'Activando...' : 'Reintentar'}
          </button>
        </>
      )}

    </div>
  )
}
