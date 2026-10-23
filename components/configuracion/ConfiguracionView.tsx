'use client'

import { useActionState, useState, useTransition } from 'react'
import { usePushNotifications } from '@/components/pwa/usePushNotifications'
import { cambiarEmail, cambiarPassword, eliminarCuenta, type EstadoCuenta } from '@/app/actions/cuenta'
import Modal from '@/components/ui/Modal'

const inicial: EstadoCuenta = { error: null, ok: false }

const inputCls = 'w-full rounded-xl border border-[#2a2a2a] bg-[#111] px-3.5 py-2.5 text-[15px] text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500'
const btnPrimario = 'flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60'
const btnSecundario = 'flex-1 rounded-xl border border-surface-2 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-surface-2'

// ─── Piezas de layout ─────────────────────────────────────────────────────────

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-white/50">{titulo}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

function Fila({ label, descripcion, control }: { label: string; descripcion?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#2a2a2a] bg-[#171717] px-5 py-4">
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-white">{label}</p>
        {descripcion && <p className="mt-1 text-sm leading-snug text-zinc-400">{descripcion}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}

// Fila entera clickeable que abre un modal
function FilaBoton({ label, peligro = false, onClick }: { label: string; peligro?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#2a2a2a] bg-[#171717] px-5 py-4 text-left transition-colors hover:bg-[#1c1c1c]"
    >
      <span className={`text-[15px] font-medium ${peligro ? 'text-red-400' : 'text-white'}`}>{label}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-500" aria-hidden="true">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  )
}

function Switch({ activo, disabled, onClick, label }: { activo: boolean; disabled?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${activo ? 'bg-blue-600' : 'bg-zinc-700'}`}
    >
      {/* Apagado: círculo a la izquierda. Encendido: a la derecha (48 − 2×4 de padding − 20 = 20px de recorrido) */}
      {/* bg-[#ffffff] literal: el círculo queda blanco también en modo claro */}
      <span className={`h-5 w-5 rounded-full bg-[#ffffff] shadow transition-transform duration-200 ${activo ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function SelectDeshabilitado({ valor, label }: { valor: string; label: string }) {
  return (
    <select disabled aria-label={label} value={valor} className="cursor-not-allowed rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2 text-sm text-zinc-400 opacity-70">
      <option value={valor}>{valor}</option>
    </select>
  )
}

function Mensaje({ estado }: { estado: EstadoCuenta }) {
  if (estado.error) return <p className="text-sm text-red-400">{estado.error}</p>
  if (estado.ok && estado.mensaje) return <p className="text-sm text-green-400">{estado.mensaje}</p>
  return null
}

// ─── Notificaciones ───────────────────────────────────────────────────────────

function FilaNotificaciones() {
  const { pushState, pending, activar, desactivar } = usePushNotifications()

  const descripcion: Record<typeof pushState, string> = {
    loading:      'Revisando el estado de tus notificaciones…',
    unsupported:  'Tu navegador no soporta notificaciones push.',
    default:      'Activalas para enterarte al instante cuando alguien te contacte.',
    granted:      'Recibís alertas cuando te llegan mensajes y solicitudes.',
    denied:       'Están bloqueadas en tu navegador. Para activarlas, tocá el ícono de candado en la barra de direcciones.',
    inconsistent: 'Hubo un problema con tu suscripción. Tocá el interruptor para reintentar.',
  }

  const activo = pushState === 'granted'
  const bloqueado = pushState === 'loading' || pushState === 'unsupported' || pushState === 'denied'

  return (
    <Fila
      label="Activar notificaciones push"
      descripcion={descripcion[pushState]}
      control={
        <Switch
          label="Activar notificaciones push"
          activo={activo}
          disabled={bloqueado || pending}
          onClick={() => (activo ? desactivar() : activar())}
        />
      }
    />
  )
}

// ─── Cuenta: modales ──────────────────────────────────────────────────────────

function ModalEmail({ emailActual, onClose }: { emailActual: string; onClose: () => void }) {
  const [estado, action, pending] = useActionState(cambiarEmail, inicial)
  return (
    <Modal titulo="Cambiar email" onClose={onClose}>
      {estado.ok ? (
        <div className="flex flex-col gap-5">
          <Mensaje estado={estado} />
          <button type="button" onClick={onClose} className={btnPrimario}>Entendido</button>
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-3">
          <p className="text-sm text-zinc-400">Tu email actual es <span className="text-zinc-200">{emailActual}</span>.</p>
          <input id="nuevo-email" name="email" type="email" required autoComplete="email" placeholder="Nuevo email" className={inputCls} />
          <input id="password-email" name="password" type="password" required autoComplete="current-password" placeholder="Contraseña actual" className={inputCls} />
          <Mensaje estado={estado} />
          <div className="mt-2 flex gap-3">
            <button type="button" onClick={onClose} className={btnSecundario}>Cancelar</button>
            <button type="submit" disabled={pending} className={btnPrimario}>{pending ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function ModalPassword({ onClose }: { onClose: () => void }) {
  const [estado, action, pending] = useActionState(cambiarPassword, inicial)
  return (
    <Modal titulo="Cambiar contraseña" onClose={onClose}>
      {estado.ok ? (
        <div className="flex flex-col gap-5">
          <Mensaje estado={estado} />
          <button type="button" onClick={onClose} className={btnPrimario}>Listo</button>
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-3">
          <input id="password-actual" name="actual" type="password" required autoComplete="current-password" placeholder="Contraseña actual" className={inputCls} />
          <input id="password-nueva" name="nueva" type="password" required minLength={6} autoComplete="new-password" placeholder="Nueva contraseña (mínimo 6 caracteres)" className={inputCls} />
          <input id="password-confirmar" name="confirmar" type="password" required minLength={6} autoComplete="new-password" placeholder="Repetí la nueva contraseña" className={inputCls} />
          <Mensaje estado={estado} />
          <div className="mt-2 flex gap-3">
            <button type="button" onClick={onClose} className={btnSecundario}>Cancelar</button>
            <button type="submit" disabled={pending} className={btnPrimario}>{pending ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function ModalEliminar({ onClose }: { onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function confirmar() {
    setError(null)
    startTransition(async () => {
      // Si sale bien, la server action redirige a la landing; solo vuelve si hubo error
      const res = await eliminarCuenta()
      if (res?.error) setError(res.error)
    })
  }

  return (
    <Modal titulo="¿Seguro?" onClose={pending ? () => {} : onClose}>
      <p className="text-sm leading-relaxed text-zinc-400">
        Esta acción no se puede deshacer. Perderás todas tus publicaciones, mensajes y datos.
      </p>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={confirmar}
          disabled={pending}
          className="rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}
        </button>
        <button type="button" onClick={onClose} disabled={pending} className="rounded-xl py-2.5 text-sm text-zinc-400 transition-colors hover:text-white">
          Cancelar
        </button>
      </div>
    </Modal>
  )
}

// ─── Vista ────────────────────────────────────────────────────────────────────

type ModalAbierto = 'email' | 'password' | 'eliminar' | null

export default function ConfiguracionView({ email }: { email: string }) {
  const [modal, setModal] = useState<ModalAbierto>(null)
  const cerrar = () => setModal(null)

  return (
    <div className="flex flex-col gap-8">
      <Grupo titulo="Notificaciones">
        <FilaNotificaciones />
      </Grupo>

      <Grupo titulo="Cuenta">
        <FilaBoton label="Cambiar email" onClick={() => setModal('email')} />
        <FilaBoton label="Cambiar contraseña" onClick={() => setModal('password')} />
        <FilaBoton label="Eliminar cuenta" peligro onClick={() => setModal('eliminar')} />
      </Grupo>

      {/* Privacidad e idioma: estructura preparada, todavía no configurable */}
      <Grupo titulo="Privacidad">
        <Fila label="¿Quién puede ver mi perfil?" control={<SelectDeshabilitado label="¿Quién puede ver mi perfil?" valor="Todos" />} />
      </Grupo>

      <Grupo titulo="Idioma">
        <Fila label="Idioma de la app" control={<SelectDeshabilitado label="Idioma de la app" valor="Español" />} />
      </Grupo>

      {modal === 'email'    && <ModalEmail emailActual={email} onClose={cerrar} />}
      {modal === 'password' && <ModalPassword onClose={cerrar} />}
      {modal === 'eliminar' && <ModalEliminar onClose={cerrar} />}
    </div>
  )
}
