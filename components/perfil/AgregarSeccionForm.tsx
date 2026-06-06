'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { agregarSeccion } from '@/app/actions/perfil'
import { useProgress } from '@/lib/useProgress'

const TIPOS = [
  { value: 'experiencia',  label: 'Experiencia' },
  { value: 'educacion',    label: 'Educación' },
  { value: 'certificado',  label: 'Certificado' },
  { value: 'proyecto',     label: 'Proyecto' },
  { value: 'curso',        label: 'Curso' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1970 + 1 }, (_, i) => CURRENT_YEAR - i)

const SELECT_CLS = 'rounded-lg border border-zinc-600 bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-zinc-400'
const INPUT_CLS  = 'rounded-lg border border-zinc-600 bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-zinc-400 placeholder:text-zinc-500'

const init = { error: null as string | null, ok: false }

export default function AgregarSeccionForm() {
  const [state, action, pending] = useActionState(agregarSeccion, init)
  useProgress(pending)
  const formRef    = useRef<HTMLFormElement>(null)
  const [open, setOpen]           = useState(false)
  const [actualidad, setActualidad] = useState(false)

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset()
      setOpen(false)
      setActualidad(false)
    }
  }, [state])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-surface-2 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-300"
      >
        <span className="text-base leading-none">+</span>
        Agregar
      </button>
    )
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 rounded-lg border border-surface-2 bg-surface-1 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-300">Nueva entrada</p>
        <button type="button" onClick={() => { setOpen(false); setActualidad(false) }} className="text-xs text-zinc-500 hover:text-zinc-300">
          Cancelar
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Tipo</label>
          <select name="type" defaultValue="experiencia" className={SELECT_CLS}>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="flex flex-[2] flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Título *</label>
          <input name="title" required placeholder="Ej: Técnico Electricista" className={INPUT_CLS} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Empresa / Institución</label>
        <input name="subtitle" placeholder="Ej: ORT Argentina" className={`w-full ${INPUT_CLS}`} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Desde</label>
            <select name="date_from" className={SELECT_CLS}>
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
              <select name="date_to" className={SELECT_CLS}>
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
        <label className="mb-1 block text-xs font-medium text-zinc-500">URL (opcional)</label>
        <input name="url" type="url" placeholder="https://..." className={`w-full ${INPUT_CLS}`} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Descripción (opcional)</label>
        <textarea name="description" rows={2} placeholder="Descripción breve..." className={`w-full resize-none ${INPUT_CLS}`} />
      </div>

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-40"
      >
        {pending ? 'Guardando...' : 'Agregar'}
      </button>
    </form>
  )
}
