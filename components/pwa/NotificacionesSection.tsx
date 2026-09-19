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
      console.log('[PUSH][state] Iniciando detección de estado')

      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('[PUSH][state] Navegador sin soporte — Notification:', 'Notification' in window, '/ serviceWorker:', 'serviceWorker' in navigator)
        setPushState('unsupported')
        return
      }

      const perm = Notification.permission
      console.log('[PUSH][state] Notification.permission:', perm)

      if (perm === 'denied') { setPushState('denied'); return }
      if (perm === 'default') { setPushState('default'); return }

      // perm === 'granted' — verificar consistencia por pasos independientes
      let localSub: PushSubscription | null = null
      try {
        console.log('[PUSH][state] Buscando service worker registration...')
        const reg = await navigator.serviceWorker.getRegistration()
        console.log('[PUSH][state] Service worker registration:', reg ? `encontrada (active: ${reg.active?.state})` : 'null/undefined')

        if (reg) {
          localSub = await reg.pushManager.getSubscription()
        }
        console.log('[PUSH][state] pushManager.getSubscription() result:', localSub ? localSub.endpoint.slice(0, 50) + '...' : 'null')
      } catch (err) {
        console.error('[PUSH][state] Error al obtener suscripción local:', err)
      }

      let dbHasSub = false
      try {
        console.log('[PUSH][state] Consultando Supabase via verificarPushSubscription()...')
        dbHasSub = await verificarPushSubscription()
        console.log('[PUSH][state] Supabase result:', dbHasSub)
      } catch (err) {
        console.error('[PUSH][state] Error al consultar Supabase:', err)
      }

      const finalState = (localSub && dbHasSub) ? 'granted' : 'inconsistent'
      console.log('[PUSH][state] Estado final calculado:', finalState === 'granted' ? 'B — granted' : 'D — inconsistent (localSub: ' + !!localSub + ', dbHasSub: ' + dbHasSub + ')')
      console.log('[PUSH][state] shouldRender: true')
      setPushState(finalState)
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
      console.log('[PUSH] Solicitando permiso...')
      const perm = await Notification.requestPermission()
      console.log('[PUSH] Permiso:', perm)

      if (perm === 'denied') { setPushState('denied'); return }
      if (perm !== 'granted') return

      if (!('serviceWorker' in navigator)) {
        showToast('Tu navegador no soporta notificaciones push.')
        return
      }

      console.log('[PUSH] Esperando service worker...')
      const reg = await navigator.serviceWorker.ready
      console.log('[PUSH] SW listo:', reg.active?.state)

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('[PUSH] VAPID key no configurada')
        showToast('Error de configuración. Contactá al soporte.')
        return
      }

      console.log('[PUSH] Suscribiendo a push...')
      let sub: PushSubscription
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
        console.log('[PUSH] Suscripción creada:', sub.endpoint.slice(0, 60) + '...')
      } catch (err) {
        console.error('[PUSH] pushManager.subscribe() falló:', err)
        showToast('No se pudo suscribir a las notificaciones. Si estás en Safari, instalá la app en tu pantalla de inicio primero.')
        return
      }

      console.log('[PUSH] Guardando suscripción en Supabase...')
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      const { error } = await guardarPushSubscription(json)
      if (error) {
        console.error('[PUSH] guardarPushSubscription falló:', error)
        showToast('No se pudo guardar la suscripción. Intentá de nuevo.')
        return
      }

      console.log('[PUSH] Suscripción guardada. Estado: granted.')
      setPushState('granted')
      showToast('Notificaciones activadas correctamente.')
    } catch (err) {
      console.error('[PUSH] Error inesperado:', err)
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
            Activá las notificaciones para enterarte cuando alguien te mande un mensaje o se postule a tus publicaciones.
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
          <p className="text-sm text-zinc-500">Recibís alertas cuando te llegan mensajes o postulaciones.</p>
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
