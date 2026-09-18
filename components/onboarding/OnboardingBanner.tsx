'use client'

import { useEffect, useState, useTransition } from 'react'
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

export default function OnboardingBanner({ step1Done, step2Done, step3Done, step4Done }: Props) {
  const [open, setOpen]               = useState(false)
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

      // Si bloqueó: marcar paso como hecho igual para no dejarlo trabado
      if (perm === 'denied') {
        await completarOnboardingNotificaciones()
        setStep4LocalDone(true)
        router.refresh()
        return
      }

      if (perm !== 'granted') return

      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (vapidKey) {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          })
          const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
          await guardarPushSubscription(json)
        }
      }

      await completarOnboardingNotificaciones()
      setStep4LocalDone(true)
      router.refresh()
      showToast('Notificaciones activadas.')
    } catch (err) {
      console.error('[OnboardingBanner] activarNotificaciones:', err)
      // Marcar paso como hecho aunque haya fallado la suscripción push
      await completarOnboardingNotificaciones()
      setStep4LocalDone(true)
      router.refresh()
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
      title: 'Publicá tu primera oferta o búsqueda',
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

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-blue-900/50 bg-blue-950/40">
      {/* Cabecera */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Primeros pasos en Labu</p>
          <p className="mt-0.5 text-xs text-zinc-400">{totalDone} de {total} completados</p>
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-surface-2 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-surface-2"
        >
          {open ? 'Ocultar' : 'Ver pasos'}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="px-4 pb-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Lista de pasos */}
      {open && (
        <div className="flex flex-col gap-3 border-t border-surface-2 px-4 py-4">
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
      )}
    </div>
  )
}
