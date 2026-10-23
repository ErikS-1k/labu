'use client'

import { usePushNotifications } from './usePushNotifications'

function IconBell() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

export default function NotificacionesSection() {
  const { pushState, pending, activar, desactivar } = usePushNotifications()

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
