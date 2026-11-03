'use client'

import { useSyncExternalStore } from 'react'
import Image from 'next/image'
import { avatarBg } from '@/lib/avatar'
import type { NotifItem } from '@/lib/notificaciones'

// Lista de notificaciones estilo Instagram: [avatar o ícono] texto (nombre en negrita) [ícono/CTA] hora.
// La usan el panel de desktop (NotificationBell) y la pantalla /notificaciones.

// ─── Íconos ───────────────────────────────────────────────────────────────────

const p = { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const
const IconChat   = ({ s = 18 }: { s?: number }) => <svg {...p} width={s} height={s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
const IconCheck  = ({ s = 18 }: { s?: number }) => <svg {...p} width={s} height={s} strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
const IconMail   = ({ s = 18 }: { s?: number }) => <svg {...p} width={s} height={s}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
const IconDone   = ({ s = 22 }: { s?: number }) => <svg {...p} width={s} height={s}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
const IconStar   = ({ s = 22 }: { s?: number }) => <svg {...p} width={s} height={s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const IconShield = ({ s = 22 }: { s?: number }) => <svg {...p} width={s} height={s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IconX      = ({ s = 22 }: { s?: number }) => <svg {...p} width={s} height={s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconSend   = ({ s = 22 }: { s?: number }) => <svg {...p} width={s} height={s}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const IconBell   = ({ s = 22 }: { s?: number }) => <svg {...p} width={s} height={s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>

// Ícono de la derecha según el tipo (A: mensaje, B: aceptada, C: solicitud recibida)
const ICONO_DERECHA: Record<string, React.ReactNode> = {
  nuevo_mensaje:        <span className="text-blue-400"><IconChat /></span>,
  postulacion_aceptada: <span className="text-green-400"><IconCheck /></span>,
  nueva_postulacion:    <span className="text-blue-400"><IconMail /></span>,
}

// Avisos del sistema (sin persona): ícono en lugar de avatar
const ICONO_SISTEMA: Record<string, { icono: React.ReactNode; cls: string }> = {
  trabajo_completado:        { icono: <IconDone />,   cls: 'bg-green-500/15 text-green-400' },
  nuevo_rating:              { icono: <IconStar />,   cls: 'bg-yellow-500/15 text-yellow-400' },
  verificacion_aprobada:     { icono: <IconShield />, cls: 'bg-green-500/15 text-green-400' },
  verificacion_rechazada:    { icono: <IconX />,      cls: 'bg-orange-500/15 text-orange-400' },
  postulacion_rechazada:     { icono: <IconX />,      cls: 'bg-orange-500/15 text-orange-400' },
  postulacion_enviada:       { icono: <IconSend />,   cls: 'bg-blue-500/15 text-blue-400' },
  recordatorio_calificacion: { icono: <IconBell />,   cls: 'bg-orange-500/15 text-orange-400' },
  nuevo_mensaje:             { icono: <IconChat s={22} />,  cls: 'bg-blue-500/15 text-blue-400' },
  postulacion_aceptada:      { icono: <IconCheck s={22} />, cls: 'bg-green-500/15 text-green-400' },
  nueva_postulacion:         { icono: <IconMail s={22} />,  cls: 'bg-blue-500/15 text-blue-400' },
}

// ─── Tiempo ───────────────────────────────────────────────────────────────────

// "ahora", "5min", "3h", "2d", "3sem", "15 oct"
function horaCompacta(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1)   return 'ahora'
  if (mins < 60)  return `${mins}min`
  const horas = Math.floor(mins / 60)
  if (horas < 24) return `${horas}h`
  const dias = Math.floor(horas / 24)
  if (dias < 7)   return `${dias}d`
  if (dias < 30)  return `${Math.floor(dias / 7)}sem`
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '')
}

function seccion(iso: string): 'hoy' | 'semana' | 'anteriores' {
  const ahora = new Date()
  const hoy   = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const fecha = new Date(iso)
  if (fecha >= hoy) return 'hoy'
  if (fecha >= new Date(hoy.getTime() - 6 * 86400000)) return 'semana'
  return 'anteriores'
}

const TITULOS = { hoy: 'Hoy', semana: 'Esta semana', anteriores: 'Anteriores' } as const

// Las horas y secciones dependen del reloj/zona del usuario: se calculan en el navegador
const sinSuscripcion = () => () => {}
function useEnNavegador() { return useSyncExternalStore(sinSuscripcion, () => true, () => false) }

// ─── Fila ─────────────────────────────────────────────────────────────────────

function Fila({ n, onTocar, enNavegador }: { n: NotifItem; onTocar: (n: NotifItem) => void; enNavegador: boolean }) {
  const sistema = ICONO_SISTEMA[n.type] ?? { icono: <IconBell />, cls: 'bg-surface-2 text-zinc-400' }
  return (
    <li>
      <button
        type="button"
        onClick={() => onTocar(n)}
        className={`relative flex w-full items-start gap-3 py-3 pl-6 pr-4 text-left transition-colors hover:bg-white/5 ${n.read ? '' : 'bg-blue-500/5'}`}
      >
        {!n.read && <span className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-500" aria-label="Sin leer" />}

        {n.actor ? (
          n.actor.avatar_url
            ? <Image src={n.actor.avatar_url} width={48} height={48} sizes="48px" alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
            : <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white ${avatarBg(n.actor.username, n.actor.nombre, n.actor.id)}`}>{n.actor.nombre[0].toUpperCase()}</span>
        ) : (
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${sistema.cls}`}>{sistema.icono}</span>
        )}

        <span className="min-w-0 flex-1 pt-0.5">
          <span className={`block text-sm leading-snug ${n.read ? 'text-zinc-300' : 'text-white'}`}>
            {n.nombre && <strong className="font-semibold text-white">{n.nombre}</strong>}
            {n.nombre && n.texto ? ' ' : ''}
            {n.texto}
          </span>
          {n.subtexto && <span className="mt-0.5 block truncate text-sm text-zinc-500">{n.subtexto}</span>}
        </span>

        <span className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
          <span className="flex items-center gap-2">
            {n.actor && ICONO_DERECHA[n.type]}
            <span className={`text-xs ${n.read ? 'text-zinc-500' : 'font-medium text-blue-400'}`}>{enNavegador ? horaCompacta(n.created_at) : ''}</span>
          </span>
          {n.cta && (
            <span className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white">{n.cta}</span>
          )}
        </span>
      </button>
    </li>
  )
}

// ─── Lista ────────────────────────────────────────────────────────────────────

export default function NotificacionesList({ items, onTocar }: { items: NotifItem[]; onTocar: (n: NotifItem) => void }) {
  const enNavegador = useEnNavegador()

  if (items.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-zinc-400"><IconBell /></span>
        <p className="text-sm font-medium text-zinc-300">Todo tranquilo por acá</p>
        <p className="mt-1 text-xs text-zinc-500">Cuando alguien te contacte, te deje una opinión o te mande un mensaje, te avisamos acá.</p>
      </div>
    )
  }

  // Sin reloj del navegador (primer render del servidor) todo va en una sola sección sin título
  const secciones = enNavegador
    ? (['hoy', 'semana', 'anteriores'] as const)
        .map(k => ({ k, items: items.filter(n => seccion(n.created_at) === k) }))
        .filter(s => s.items.length > 0)
    : [{ k: null, items }]

  return (
    <div className="flex flex-col">
      {secciones.map(s => (
        <section key={s.k ?? 'todas'} className="pb-2">
          {s.k && <h3 className="px-4 pb-1 pt-3 text-sm font-semibold text-white">{TITULOS[s.k]}</h3>}
          <ul className="divide-y divide-[#2a2a2a]">
            {s.items.map(n => <Fila key={n.key} n={n} onTocar={onTocar} enNavegador={enNavegador} />)}
          </ul>
        </section>
      ))}
    </div>
  )
}
