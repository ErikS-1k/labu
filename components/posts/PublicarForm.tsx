'use client'

import { useActionState, useState } from 'react'
import { publicarPost } from '@/app/actions/posts'
import { MODALIDADES, PRICE_TYPES } from '@/lib/constants'

const inputClass =
  'rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200'

export default function PublicarForm({ defaultTipo = 'oferta' }: { defaultTipo?: 'oferta' | 'requerimiento' }) {
  const [state, action, pending] = useActionState(publicarPost, null)
  const [tipo, setTipo] = useState<'oferta' | 'requerimiento'>(defaultTipo)

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
      )}

      {/* Tipo */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">Tipo de publicación *</p>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio" name="type" value="oferta" required defaultChecked={defaultTipo === 'oferta'}
              onChange={() => setTipo('oferta')}
              className="accent-zinc-900"
            />
            <span className="text-sm">Ofrezco trabajo o servicio</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio" name="type" value="requerimiento" defaultChecked={defaultTipo === 'requerimiento'}
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
          placeholder={
            tipo === 'oferta'
              ? 'Ej: Plomero con 10 años de experiencia'
              : 'Ej: Necesito electricista para instalación'
          }
          className={inputClass}
        />
      </div>

      {/* Descripción */}
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-zinc-700">Descripción</label>
        <textarea
          id="description" name="description" rows={4}
          placeholder={
            tipo === 'oferta'
              ? 'Describí tus habilidades, experiencia, disponibilidad...'
              : 'Describí qué necesitás, cuándo, dónde y cualquier detalle útil...'
          }
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Categoría */}
      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-sm font-medium text-zinc-700">Categoría</label>
        <input
          id="category" name="category" type="text"
          placeholder="Ej: Plomería, Diseño web, Contabilidad..."
          className={inputClass}
        />
      </div>

      {/* Modalidad — múltiple para oferta, única para requerimiento */}
      <div>
        <p className="mb-1 text-sm font-medium text-zinc-700">
          Modalidad *{' '}
          {tipo === 'oferta' && (
            <span className="font-normal text-zinc-400">(podés elegir varias)</span>
          )}
        </p>
        {tipo === 'oferta' ? (
          <div className="flex flex-wrap gap-4">
            {MODALIDADES.map(m => (
              <label key={m.value} className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" name="modality" value={m.value} className="accent-zinc-900" />
                <span className="text-sm">{m.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {MODALIDADES.map(m => (
              <label key={m.value} className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="modality" value={m.value} required className="accent-zinc-900" />
                <span className="text-sm">{m.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Precio + Unidad */}
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="price" className="text-sm font-medium text-zinc-700">Precio (ARS)</label>
          <input
            id="price" name="price" type="number" min="0" step="100"
            placeholder="Ej: 5000"
            className={inputClass}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="price_type" className="text-sm font-medium text-zinc-700">Unidad</label>
          <select id="price_type" name="price_type" className={`${inputClass}`}>
            {PRICE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* Zona */}
      <div className="flex flex-col gap-1">
        <label htmlFor="location" className="text-sm font-medium text-zinc-700">Zona</label>
        <input
          id="location" name="location" type="text"
          placeholder="Ej: Palermo, CABA"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
      >
        {pending ? 'Publicando...' : 'Publicar'}
      </button>
    </form>
  )
}
