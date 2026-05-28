'use client'

import { useActionState, useState } from 'react'
import { editarPost } from '@/app/actions/posts'
import { MODALIDADES, PRICE_TYPES } from '@/lib/constants'

const PRESENCIALIDAD_OPTS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual',    label: 'Virtual' },
  { value: 'ambos',      label: 'Ambos' },
]

type PostData = {
  id: string
  type: 'oferta' | 'requerimiento'
  title: string
  description: string | null
  category: string | null
  modality: string[]
  presencialidad: string | null
  temporal_duration: string | null
  price: number | null
  price_type: string | null
  location: string | null
}

const inputClass =
  'rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200'

export default function EditarPostForm({ post }: { post: PostData }) {
  const [state, action, pending]    = useActionState(editarPost, null)
  const [tipo, setTipo]             = useState<'oferta' | 'requerimiento'>(post.type)
  const [modalities, setModalities] = useState<string[]>(post.modality)
  const [temporalDuration, setTemporalDuration] = useState(post.temporal_duration ?? '')
  const [presencialidad, setPresencialidad] = useState<string>(post.presencialidad ?? '')

  function toggleMod(value: string) {
    setModalities(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const muestraTemporalDuration = modalities.includes('temporal')

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
      )}

      <input type="hidden" name="post_id" value={post.id} />

      {/* Tipo */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">Tipo de publicación *</p>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio" name="type" value="oferta" required
              defaultChecked={post.type === 'oferta'}
              onChange={() => setTipo('oferta')}
              className="accent-zinc-900"
            />
            <span className="text-sm">Ofrezco trabajo o servicio</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio" name="type" value="requerimiento"
              defaultChecked={post.type === 'requerimiento'}
              onChange={() => setTipo('requerimiento')}
              className="accent-zinc-900"
            />
            <span className="text-sm">Busco trabajo o servicio</span>
          </label>
        </div>
      </div>

      {/* Título */}
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-zinc-700">Título *</label>
        <input
          id="title" name="title" type="text" required
          defaultValue={post.title}
          placeholder={tipo === 'oferta' ? 'Ej: Plomero con 10 años de experiencia' : 'Ej: Necesito electricista para instalación'}
          className={inputClass}
        />
      </div>

      {/* Descripción */}
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-zinc-700">Descripción</label>
        <textarea
          id="description" name="description" rows={4}
          defaultValue={post.description ?? ''}
          placeholder={tipo === 'oferta' ? 'Describí tus habilidades, experiencia, disponibilidad...' : 'Describí qué necesitás, cuándo, dónde y cualquier detalle útil...'}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Categoría */}
      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-sm font-medium text-zinc-700">Categoría</label>
        <input
          id="category" name="category" type="text"
          defaultValue={post.category ?? ''}
          placeholder="Ej: Plomería, Diseño web, Contabilidad..."
          className={inputClass}
        />
      </div>

      {/* Modalidad */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">
          Modalidad *{' '}
          <span className="font-normal text-zinc-400">(podés elegir varias)</span>
        </p>
        {modalities.map(v => <input key={v} type="hidden" name="modality" value={v} />)}
        <div className="flex flex-wrap gap-2">
          {MODALIDADES.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => toggleMod(m.value)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                modalities.includes(m.value)
                  ? 'border-zinc-400 bg-zinc-700 text-white'
                  : 'border-zinc-300 bg-white text-zinc-500 hover:border-zinc-400 hover:text-zinc-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duración temporal (solo cuando "Temporal" está seleccionado) */}
      {muestraTemporalDuration && (
        <div className="flex flex-col gap-1">
          <label htmlFor="temporal_duration" className="text-sm font-medium text-zinc-700">
            Duración estimada <span className="font-normal text-zinc-400">(opcional)</span>
          </label>
          <input
            id="temporal_duration"
            type="text"
            name="temporal_duration"
            value={temporalDuration}
            onChange={e => setTemporalDuration(e.target.value)}
            placeholder="ej: 3 días, 2 semanas, 1 mes"
            maxLength={100}
            className={inputClass}
          />
        </div>
      )}

      {/* Presencialidad */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-700">Presencialidad</p>
        <input type="hidden" name="presencialidad" value={presencialidad} />
        <div className="flex gap-2">
          {PRESENCIALIDAD_OPTS.map(op => (
            <button
              key={op.value}
              type="button"
              onClick={() => setPresencialidad(prev => prev === op.value ? '' : op.value)}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all ${
                presencialidad === op.value
                  ? 'border-zinc-400 bg-zinc-700 text-white'
                  : 'border-zinc-300 bg-white text-zinc-500 hover:border-zinc-400 hover:text-zinc-700'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Precio + Unidad */}
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="price" className="text-sm font-medium text-zinc-700">Precio (ARS)</label>
          <input
            id="price" name="price" type="number" min="0" step="100"
            defaultValue={post.price ?? ''}
            placeholder="Ej: 5000"
            className={inputClass}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="price_type" className="text-sm font-medium text-zinc-700">Unidad</label>
          <select id="price_type" name="price_type" defaultValue={post.price_type ?? ''} className={inputClass}>
            {PRICE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* Zona */}
      <div className="flex flex-col gap-1">
        <label htmlFor="location" className="text-sm font-medium text-zinc-700">Zona</label>
        <input
          id="location" name="location" type="text"
          defaultValue={post.location ?? ''}
          placeholder="Ej: Palermo, CABA"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
      >
        {pending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
