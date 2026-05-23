'use client'

import { useActionState, useRef } from 'react'
import { agregarSeccion } from '@/app/actions/perfil'

const TIPOS = [
  { value: 'experiencia',  label: 'Experiencia' },
  { value: 'educacion',    label: 'Educación' },
  { value: 'certificado',  label: 'Certificado' },
  { value: 'proyecto',     label: 'Proyecto' },
  { value: 'curso',        label: 'Curso' },
]

const init = { error: null as string | null, ok: false }

export default function AgregarSeccionForm() {
  const [state, action, pending] = useActionState(agregarSeccion, init)
  const formRef = useRef<HTMLFormElement>(null)

  if (state.ok) {
    formRef.current?.reset()
  }

  return (
    <form ref={formRef} action={action} className="mt-4 flex flex-col gap-3 rounded-lg border border-surface-2 bg-surface-1 p-4">
      <p className="text-sm font-medium text-zinc-700">Agregar sección</p>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Tipo</label>
          <select
            name="type"
            defaultValue="experiencia"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          >
            {TIPOS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-[2] flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Título *</label>
          <input
            name="title"
            placeholder="Ej: Técnico Electricista"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Subtítulo / Empresa / Institución</label>
        <input
          name="subtitle"
          placeholder="Ej: ORT Argentina"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Desde</label>
          <input
            name="date_from"
            placeholder="Ej: 2020"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Hasta</label>
          <input
            name="date_to"
            placeholder="Ej: 2023 o Actualidad"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">URL de tu CV o portfolio (opcional)</label>
        <input
          name="url"
          type="url"
          placeholder="https://..."
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Descripción (opcional)</label>
        <textarea
          name="description"
          rows={2}
          placeholder="Descripción breve..."
          className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

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
