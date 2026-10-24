'use client'

import { useEffect, useState, useSyncExternalStore, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { completarOnboarding, completarOnboardingNotificaciones } from '@/app/actions/perfil'
import { guardarPushSubscription } from '@/app/actions/push'
import { showToast } from '@/lib/toast'

type Props = {
  step1Done: boolean
  step2Done: boolean
  step3Done: boolean
  step4Done: boolean
}

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

// ─── Preferencia expandido/colapsado (localStorage "labu-onboarding-expanded") ───
// useSyncExternalStore: el servidor dibuja el banner colapsado y el cliente aplica la
// preferencia guardada sin errores de hidratación. Si el navegador bloquea localStorage
// (modo privado), la preferencia vive en memoria mientras dure la sesión.
const CLAVE_EXPANDIDO = 'labu-onboarding-expanded'
const suscriptores = new Set<() => void>()
let enMemoria: boolean | null = null

function leerExpandido(): boolean {
  if (enMemoria !== null) return enMemoria
  try { return localStorage.getItem(CLAVE_EXPANDIDO) === 'true' } catch { return false }
}

function guardarExpandido(valor: boolean) {
  enMemoria = valor
  try { localStorage.setItem(CLAVE_EXPANDIDO, String(valor)) } catch { /* sin storage: queda en memoria */ }
  suscriptores.forEach(cb => cb())
}

function suscribirExpandido(cb: () => void) {
  suscriptores.add(cb)
  return () => { suscriptores.delete(cb) }
}

export default function OnboardingBanner({ step1Done, step2Done, step3Done, step4Done }: Props) {
  const open = useSyncExternalStore(suscribirExpandido, leerExpandido, () => false)
  const [pending3, startTransition3]  = useTransition()
  const [activandoNotif, setActivandoNotif] = useState(false)
  const router                        = useRouter()

  // Detecta soporte de push en el cliente (null = aún no chequeado)
  const [notifSupported, setNotifSupported] = useState<boolean | null>(null)
  // Estado local del paso 4 para reflejar activación inmediata sin esperar page refresh
  const [step4LocalDone, setStep4LocalDone] = useState(step4Done)

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator
    setNotifSupported(supported)

    // Si el navegador no soporta notificaciones y el paso aún no está marcado,
    // marcarlo automáticamente para que el banner desaparezca en la próxima carga
    if (!supported && !step4Done) {
      completarOnboardingNotificaciones()
    }

    // Si el permiso ya fue concedido previamente y hay subscripción activa,
    // marcar el paso sin interacción del usuario
    if (supported && Notification.permission === 'granted' && !step4Done) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            completarOnboardingNotificaciones().then(() => setStep4LocalDone(true))
          }
        })
      })
    }
  }, [step4Done])

  async function activarNotificaciones() {
    setActivandoNotif(true)
    try {
      const perm = await Notification.requestPermission()

      // Bloqueó o dismissed: marcar paso como hecho para no dejar al usuario trabado
      if (perm === 'denied' || perm !== 'granted') {
        await completarOnboardingNotificaciones()
        setStep4LocalDone(true)
        router.refresh()
        return
      }

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

      let sub: PushSubscription | null = null
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
      } catch (err) {
        console.error('[push] onboarding subscribe:', err)
        showToast('No se pudo activar las notificaciones. Si estás en Safari, instalá la app en tu pantalla de inicio primero.')
        return
      }

      if (!sub) return

      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      const { error } = await guardarPushSubscription(json)
      if (error) {
        showToast('No se pudo guardar la suscripción. Intentá de nuevo.')
        return
      }

      // Solo marcar done cuando la suscripción está realmente en Supabase
      await completarOnboardingNotificaciones()
      setStep4LocalDone(true)
      router.refresh()
      showToast('Notificaciones activadas.')
    } catch (err) {
      console.error('[push] onboarding activarNotificaciones:', err)
      showToast('Ocurrió un error inesperado. Probá de nuevo.')
    } finally {
      setActivandoNotif(false)
    }
  }

  function handleExplorar() {
    startTransition3(async () => {
      await completarOnboarding()
      router.push('/buscar')
    })
  }

  // Cuántos pasos aplican según el navegador
  // null = aún cargando → asumir 4 para evitar flash
  const total = notifSupported === false ? 3 : 4

  const stepsApplied = [step1Done, step2Done, step3Done, ...(notifSupported === false ? [] : [step4LocalDone])]
  const totalDone    = stepsApplied.filter(Boolean).length
  const pct          = Math.round((totalDone / total) * 100)

  // Cuando todos los pasos aplicables están completos, el banner desaparece
  if (notifSupported !== null && totalDone >= total) return null

  const steps = [
    {
      title: 'Completá tu perfil',
      desc:  'Agregá tu foto, una descripción y tu ubicación para que te encuentren más fácil.',
      done:  step1Done,
      cta: (
        <Link
          href="/perfil/editar"
          className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          Editar perfil →
        </Link>
      ),
    },
    {
      title: 'Publicá lo que ofrecés o lo que buscás',
      desc:  'Ofrecé tu servicio o publicá lo que estás buscando para empezar a conectar.',
      done:  step2Done,
      cta: (
        <Link
          href="/publicar"
          className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          Publicar →
        </Link>
      ),
    },
    {
      title: 'Explorá las publicaciones',
      desc:  'Descubrí lo que hay disponible en Labu.',
      done:  step3Done,
      cta: (
        <button
          onClick={handleExplorar}
          disabled={pending3}
          className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300 disabled:opacity-50"
        >
          {pending3 ? 'Cargando...' : 'Explorar →'}
        </button>
      ),
    },
    ...(notifSupported !== false ? [{
      title: 'Activar notificaciones',
      desc:  'Enterate al instante cuando alguien te contacte.',
      done:  step4LocalDone,
      icon:  (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
      cta: (
        <button
          onClick={activarNotificaciones}
          disabled={activandoNotif}
          className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300 disabled:opacity-50"
        >
          {activandoNotif ? 'Activando...' : 'Activar →'}
        </button>
      ),
    }] : []),
  ]

  const completo = totalDone >= total

  return (
    <div className="mb-6 overflow-hidden rounded-xl bg-surface-2">
      {/* Línea colapsada: toda la fila es clickeable */}
      <button
        type="button"
        onClick={() => guardarExpandido(!open)}
        aria-expanded={open}
        aria-controls="primeros-pasos"
        className="flex h-12 w-full cursor-pointer items-center gap-3 px-4 text-left transition-colors hover:bg-surface-3"
      >
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          completo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
          Primeros pasos: <span className="text-zinc-400">{totalDone}/{total} completados</span>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className={`shrink-0 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Contenido expandible: barra de progreso + pasos (la altura se anima con grid-rows) */}
      <div
        id="primeros-pasos"
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden" inert={!open}>
          <div className="px-4 pb-1 pt-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 border-t border-surface-3 px-4 py-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                {step.done ? (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-900/50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-emerald-400"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-surface-3 text-xs font-semibold text-zinc-500">
                    {i + 1}
                  </div>
                )}

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className={`text-sm font-medium leading-tight ${step.done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                    {step.title}
                  </p>
                  {!step.done && (
                    <>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{step.desc}</p>
                      <div className="mt-2">{step.cta}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
