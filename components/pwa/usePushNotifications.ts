'use client'

import { useEffect, useState } from 'react'
import { guardarPushSubscription, eliminarPushSubscription, verificarPushSubscription } from '@/app/actions/push'
import { showToast } from '@/lib/toast'

// Lógica compartida de notificaciones push (estados A/B/C/D): la usan la card de
// /notificaciones (NotificacionesSection) y el toggle de /configuracion.

export type PushState = 'loading' | 'unsupported' | 'default' | 'granted' | 'denied' | 'inconsistent'

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

export function usePushNotifications() {
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

  return { pushState, pending, activar, desactivar }
}
