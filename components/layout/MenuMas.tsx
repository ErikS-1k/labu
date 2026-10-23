'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { logout } from '@/app/actions/auth'
import { showToast } from '@/lib/toast'

// Menú "Más" (estilo Instagram): popover con las opciones de uso esporádico.
// No es una ruta — es un overlay flotante que no cambia la URL.
//   mobile  → se abre hacia arriba, anclado a la derecha de la BottomNav
//   desktop → se abre hacia la derecha del sidebar, alineado con el botón "Más"

type Props = {
  variante: 'mobile' | 'desktop'
  actividadCount: number
  // Contenido y estilo del botón que abre el menú (cada nav tiene su propio diseño)
  trigger: (abierto: boolean) => React.ReactNode
  triggerClassName: string
  onOpenChange?: (abierto: boolean) => void
}

// ─── Íconos ───────────────────────────────────────────────────────────────────

const svgProps = {
  xmlns: 'http://www.w3.org/2000/svg', width: 24, height: 24, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
} as const

function IconConfig() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function IconActividad() {
  return (
    <svg {...svgProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}

function IconVerificacion() {
  return (
    <svg {...svgProps}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  )
}

function IconLuna() {
  return (
    <svg {...svgProps}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function IconAyuda() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function IconSalir() {
  return (
    <svg {...svgProps}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

// ─── Filas ────────────────────────────────────────────────────────────────────

const filaCls = 'flex w-full items-center gap-3.5 px-4 py-3 text-left text-[15px] font-medium outline-none transition-colors hover:bg-[#1f1f1f] focus-visible:bg-[#1f1f1f]'

function BotonSalir() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      role="menuitem"
      disabled={pending}
      className={`${filaCls} text-red-400/80 hover:text-red-400 disabled:opacity-60`}
    >
      <IconSalir />
      {pending ? 'Saliendo…' : 'Salir'}
    </button>
  )
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function MenuMas({ variante, actividadCount, trigger, triggerClassName, onOpenChange }: Props) {
  const [abierto, setAbierto]   = useState(false)
  const [posDesktop, setPos]    = useState<{ left: number; bottom: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef    = useRef<HTMLDivElement>(null)

  function cambiar(valor: boolean) {
    setAbierto(valor)
    onOpenChange?.(valor)
  }

  function toggle() {
    if (!abierto && variante === 'desktop' && triggerRef.current) {
      // Anclar a la derecha del sidebar, con el borde inferior alineado al botón
      const aside = triggerRef.current.closest('aside')
      const rectBoton = triggerRef.current.getBoundingClientRect()
      const borde = aside?.getBoundingClientRect().right ?? rectBoton.right
      setPos({ left: borde + 8, bottom: window.innerHeight - rectBoton.bottom })
    }
    cambiar(!abierto)
  }

  // Al abrir: foco en la primera opción (accesibilidad con teclado)
  useEffect(() => {
    if (abierto) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [abierto])

  // Cerrar con click/toque afuera o Escape (onOpenChange debe ser estable, ej. un setState)
  useEffect(() => {
    if (!abierto) return

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setAbierto(false)
      onOpenChange?.(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAbierto(false)
        onOpenChange?.(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [abierto, onOpenChange])

  // Flechas arriba/abajo para moverse entre opciones
  function onMenuKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const actual = items.indexOf(document.activeElement as HTMLElement)
    const siguiente = e.key === 'ArrowDown'
      ? (actual + 1) % items.length
      : (actual - 1 + items.length) % items.length
    items[siguiente]?.focus()
  }

  function proximamente() {
    showToast('Próximamente', 'warning')
    cambiar(false)
  }

  const posicionCls = variante === 'mobile'
    ? 'right-3 origin-bottom-right'
    : 'origin-bottom-left'
  const posicionStyle: React.CSSProperties = variante === 'mobile'
    ? { bottom: 'calc(env(safe-area-inset-bottom) + 5.75rem)' }
    : { left: posDesktop?.left ?? 0, bottom: posDesktop?.bottom ?? 0 }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? `menu-mas-${variante}` : undefined}
        className={triggerClassName}
      >
        {trigger(abierto)}
      </button>

      {abierto && (
        <div
          ref={menuRef}
          id={`menu-mas-${variante}`}
          role="menu"
          aria-label="Más opciones"
          onKeyDown={onMenuKeyDown}
          style={posicionStyle}
          className={`fixed z-[80] w-64 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#171717] py-1.5 text-zinc-200 shadow-xl shadow-black/50 transition-[opacity,transform] duration-150 ease-out starting:scale-95 starting:opacity-0 ${posicionCls}`}
        >
          <Link href="/configuracion" role="menuitem" onClick={() => cambiar(false)} className={filaCls}>
            <IconConfig />
            Configuración
          </Link>

          <Link href="/mi-actividad" role="menuitem" onClick={() => cambiar(false)} className={filaCls}>
            <IconActividad />
            <span className="flex-1">Mi actividad</span>
            {actividadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {actividadCount > 9 ? '9+' : actividadCount}
              </span>
            )}
          </Link>

          <Link href="/verificacion" role="menuitem" onClick={() => cambiar(false)} className={filaCls}>
            <IconVerificacion />
            Confirmar identidad
          </Link>

          <button type="button" role="menuitem" onClick={proximamente} className={filaCls}>
            <IconLuna />
            Cambiar apariencia
          </button>

          <Link href="/reportar-problema" role="menuitem" onClick={() => cambiar(false)} className={filaCls}>
            <IconAyuda />
            Reportar un problema
          </Link>

          <div role="separator" className="my-1.5 h-px bg-[#2a2a2a]" />

          <form action={logout}>
            <BotonSalir />
          </form>
        </div>
      )}
    </>
  )
}
