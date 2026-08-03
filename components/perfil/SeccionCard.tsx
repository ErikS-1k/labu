'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { eliminarSeccion, editarSeccion } from '@/app/actions/perfil'
import { useProgress } from '@/lib/useProgress'

const TIPOS = [
  { value: 'experiencia',  label: 'Experiencia' },
  { value: 'educacion',    label: 'Educación' },
  { value: 'certificado',  label: 'Certificado' },
  { value: 'proyecto',     label: 'Proyecto' },
  { value: 'curso',        label: 'Curso' },
]
const TIPO_LABEL: Record<string, string> = Object.fromEntries(TIPOS.map(t => [t.value, t.label]))

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1970 + 1 }, (_, i) => CURRENT_YEAR - i)

const SELECT_CLS = 'rounded-lg border border-zinc-600 bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-zinc-400'
const INPUT_CLS  = 'rounded-lg border border-zinc-600 bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-zinc-400 placeholder:text-zinc-500'

type Seccion = {
  id: string
  type: string
  title: string
  subtitle: string | null
  date_from: string | null
  date_to: string | null
  url: string | null
  description: string | null
}

const editInit = { error: null as string | null, ok: false }

export default function SeccionCard({ s }: { s: Seccion }) {
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [editOpen,  setEditOpen]  = useState(false)
  const [actualidad, setActualidad] = useState(s.date_to === 'Actualidad')
  const [deletePending, startDelete] = useTransition()
  const [editState, editAction, editPending] = useActionState(editarSeccion, editInit)
  useProgress(deletePending || editPending)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    if (editState.ok) setEditOpen(false)
  }, [editState])

  function handleEliminar() {
    setMenuOpen(false)
    startDelete(async () => { await eliminarSeccion(s.id) })
  }

  function handleEditarClick() {
    setMenuOpen(false)
    setActualidad(s.date_to === 'Actualidad')
    setEditOpen(true)
  }

  return (
    <div className={`rounded-lg border border-surface-2 bg-surface-1 px-4 py-3 transition-opacity ${deletePending ? 'opacity-40' : ''}`}>
      {!editOpen ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {TIPO_LABEL[s.type] ?? s.type}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-white">{s.title}</p>
            {s.subtitle && <p className="text-xs text-zinc-500">{s.subtitle}</p>}
            {(s.date_from || s.date_to) && (
              <p className="text-xs text-zinc-400">
                {[s.date_from, s.date_to].filter(Boolean).join(' – ')}
              </p>
            )}
            {s.description && (
              <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{s.description}</p>
            )}
          </div>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg leading-none text-zinc-400 transition-colors hover:bg-surface-2 hover:text-white"
              aria-label="Opciones"
            >
              ···
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 z-20 min-w-[130px] rounded-xl border border-surface-2 bg-surface-1 py-1 shadow-xl">
                <button
                  type="button"
                  onClick={handleEditarClick}
                  className="block w-full px-4 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-surface-2 hover:text-white"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={handleEliminar}
                  className="block w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-900/20"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form action={editAction} className="flex flex-col gap-3">
          <input type="hidden" name="section_id" value={s.id} />

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-300">Editar</p>
            <button type="button" onClick={() => setEditOpen(false)} className="text-xs text-zinc-500 hover:text-zinc-300">
              Cancelar
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Tipo</label>
              <select name="type" defaultValue={s.type} className={SELECT_CLS}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-[2] flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Título *</label>
              <input name="title" defaultValue={s.title} required className={INPUT_CLS} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Empresa / Institución</label>
            <input name="subtitle" defaultValue={s.subtitle ?? ''} className={`w-full ${INPUT_CLS}`} />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">Desde</label>
                <select name="date_from" defaultValue={s.date_from ?? ''} className={SELECT_CLS}>
                  <option value="">Año</option>
                  {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">Hasta</label>
                {actualidad ? (
                  <>
                    <input type="hidden" name="date_to" value="Actualidad" />
                    <div className="flex h-[38px] items-center rounded-lg border border-zinc-600 bg-surface-2 px-3 text-sm text-zinc-400">
                      Actualidad
                    </div>
                  </>
                ) : (
                  <select name="date_to" defaultValue={s.date_to ?? ''} className={SELECT_CLS}>
                    <option value="">Año</option>
                    {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                  </select>
                )}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={actualidad}
                onChange={e => setActualidad(e.target.checked)}
                className="rounded"
              />
              Actualidad
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Descripción (opcional)</label>
            <textarea name="description" defaultValue={s.description ?? ''} rows={2} className={`w-full resize-none ${INPUT_CLS}`} />
          </div>

          {editState.error && <p className="text-sm text-red-500">{editState.error}</p>}

          <button
            type="submit"
            disabled={editPending}
            className="self-start rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
          >
            {editPending ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}
    </div>
  )
}
