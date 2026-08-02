'use client'

import { useActionState, useState } from 'react'
import { publicarPost } from '@/app/actions/posts'
import { MODALIDADES, PRICE_TYPES } from '@/lib/constants'
import { useProgress } from '@/lib/useProgress'

const inputBase =
  'rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2'
const inputNormal =
  `${inputBase} border-zinc-300 focus:border-zinc-500 focus:ring-zinc-200`
const inputError =
  `${inputBase} border-red-400 focus:border-red-400 focus:ring-red-100`

const CATEGORIAS = [
  'Oficios',
  'Tecnología',
  'Educación',
  'Salud y bienestar',
  'Arte y diseño',
  'Gastronomía',
  'Transporte',
  'Otro',
]

const PRESENCIALIDAD_OPTS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual',    label: 'Virtual' },
  { value: 'ambos',      label: 'Ambos' },
]

export default function PublicarForm({ defaultTipo = 'oferta' }: { defaultTipo?: 'oferta' | 'requerimiento' }) {
  const [state, action, pending]              = useActionState(publicarPost, null)
  useProgress(pending)
  const [tipo, setTipo]                       = useState<'oferta' | 'requerimiento'>(defaultTipo)
  const [titulo, setTitulo]                   = useState('')
  const [descripcion, setDescripcion]         = useState('')
  const [catSel, setCatSel]                   = useState('')
  const [catCustom, setCatCustom]             = useState('')
  const [precio, setPrecio]                   = useState('')
  const [precioTipo, setPrecioTipo]           = useState('hora')
  const [aDefinir, setADefinir]               = useState<boolean | null>(null)
  const [zona, setZona]                       = useState('')
  const [modalidades, setModalidades]           = useState<string[]>([])
  const [temporalDuration, setTemporalDuration] = useState('')
  const [presencialidad, setPresencialidad]     = useState('')
  const [fieldErrors, setFieldErrors]           = useState<{ title?: string; modality?: string; precio?: string }>({})

  function handleTipoChange(nuevoTipo: 'oferta' | 'requerimiento') {
    setTipo(nuevoTipo)
    setModalidades([])
    setFieldErrors({})
  }

  function toggleModalidad(value: string, checked: boolean) {
    setModalidades(prev =>
      checked ? [...prev, value] : prev.filter(v => v !== value)
    )
    if (fieldErrors.modality) setFieldErrors(e => ({ ...e, modality: undefined }))
  }

  function handleADefinir(checked: boolean) {
    setADefinir(checked)
    if (checked) {
      setPrecio('')
      setPrecioTipo('a_convenir')
    } else {
      setPrecioTipo('hora')
    }
    if (fieldErrors.precio) setFieldErrors(e => ({ ...e, precio: undefined }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const errors: { title?: string; modality?: string; precio?: string } = {}
    if (!titulo.trim()) errors.title = 'Este campo es obligatorio'
    if (modalidades.length === 0) errors.modality = 'Seleccioná al menos una duración'
    if (aDefinir === null)          errors.precio = 'Elegí cómo querés cobrar'
    else if (!aDefinir && !precio) errors.precio = 'Ingresá el precio'
    if (Object.keys(errors).length > 0) {
      e.preventDefault()
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
  }

  const categoryValue = catSel === 'Otro' ? catCustom.trim() : catSel
  const labelOpcional = <span className="font-normal text-zinc-400">(opcional)</span>

  return (
    <form action={action} onSubmit={handleSubmit} className="flex flex-col gap-5">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
      )}

      {/* Tipo */}
      <input type="hidden" name="type" value={tipo} />
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleTipoChange('oferta')}
          className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-4 py-4 text-center transition-all ${
            tipo === 'oferta'
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-zinc-700 bg-surface-1 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
          }`}
        >
          <span className="text-2xl">🛠️</span>
          <span className="text-sm font-semibold leading-tight">Ofrezco mis servicios</span>
        </button>
        <button
          type="button"
          onClick={() => handleTipoChange('requerimiento')}
          className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-4 py-4 text-center transition-all ${
            tipo === 'requerimiento'
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-zinc-700 bg-surface-1 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
          }`}
        >
          <span className="text-2xl">🔍</span>
          <span className="text-sm font-semibold leading-tight">Necesito contratar</span>
        </button>
      </div>

      {/* Título */}
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-zinc-700">
          Título de la publicación *
        </label>
        <input
          id="title" name="title" type="text"
          value={titulo}
          onChange={e => { setTitulo(e.target.value); if (fieldErrors.title) setFieldErrors(er => ({ ...er, title: undefined })) }}
          placeholder={
            tipo === 'oferta'
              ? 'Ej: Plomero con 10 años de experiencia'
              : 'Ej: Necesito electricista para instalación'
          }
          className={fieldErrors.title ? inputError : inputNormal}
        />
        {fieldErrors.title && <p className="text-xs text-red-500">{fieldErrors.title}</p>}
      </div>

      {/* Descripción */}
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-zinc-700">
          Descripción {labelOpcional}
        </label>
        <textarea
          id="description" name="description" rows={4}
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Describí qué hacés, cómo lo hacés, tu experiencia, disponibilidad..."
          className={`${inputNormal} resize-none`}
        />
      </div>

      {/* Categoría */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-700">Categoría {labelOpcional}</p>
        <input type="hidden" name="category" value={categoryValue} />
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => { setCatSel(cat); if (cat !== 'Otro') setCatCustom('') }}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                catSel === cat
                  ? 'border-zinc-400 bg-zinc-700 text-white'
                  : 'border-zinc-700 bg-surface-1 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {catSel === 'Otro' && (
          <input
            type="text"
            value={catCustom}
            onChange={e => setCatCustom(e.target.value)}
            placeholder="Escribí tu categoría..."
            className={inputNormal}
          />
        )}
      </div>

      {/* Duración */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">
          Duración *{' '}
          <span className="font-normal text-zinc-400">(podés elegir varias)</span>
        </p>
        {modalidades.map(v => <input key={v} type="hidden" name="modality" value={v} />)}
        <div className="flex flex-wrap gap-2">
          {MODALIDADES.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => toggleModalidad(m.value, !modalidades.includes(m.value))}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                modalidades.includes(m.value)
                  ? 'border-zinc-400 bg-zinc-700 text-white'
                  : 'border-zinc-700 bg-surface-1 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {modalidades.length > 0 && (
          <div className="mt-2 flex flex-col gap-0.5">
            {MODALIDADES.filter(m => modalidades.includes(m.value)).map(m => (
              <p key={m.value} className="text-xs text-zinc-500">{m.desc}</p>
            ))}
          </div>
        )}
        {fieldErrors.modality && <p className="mt-1 text-xs text-red-500">{fieldErrors.modality}</p>}
      </div>

      {/* Duración temporal (solo cuando "Temporal" está seleccionado) */}
      {modalidades.includes('temporal') && (
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
            className="rounded-lg border border-zinc-700 bg-surface-1 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700"
          />
        </div>
      )}

      {/* Presencialidad */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-700">Presencialidad {labelOpcional}</p>
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
                  : 'border-zinc-700 bg-surface-1 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Precio + Unidad */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700">¿Cómo querés cobrar? *</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleADefinir(false)}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
                aDefinir === false
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-zinc-700 bg-surface-1 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              <span>$</span> Precio fijo
            </button>
            <button
              type="button"
              onClick={() => handleADefinir(true)}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
                aDefinir === true
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-zinc-700 bg-surface-1 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              <span>≈</span> A definir
            </button>
          </div>
          {fieldErrors.precio && <p className="mt-1.5 text-xs text-red-500">{fieldErrors.precio}</p>}
        </div>
        {aDefinir === false && (
          <div className="flex gap-3">
            <input
              id="price" name="price" type="number" min="0" step="100"
              value={precio}
              onChange={e => {
                setPrecio(e.target.value)
                if (fieldErrors.precio) setFieldErrors(er => ({ ...er, precio: undefined }))
              }}
              placeholder="Ej: 5000"
              className={`flex-1 ${fieldErrors.precio && !precio ? inputError : inputNormal}`}
            />
            <select
              id="price_type" name="price_type"
              value={precioTipo}
              onChange={e => setPrecioTipo(e.target.value)}
              className={`flex-1 ${inputNormal}`}
            >
              {PRICE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        )}
        {aDefinir === true && <input type="hidden" name="price_type" value="a_convenir" />}
      </div>

      {/* Zona */}
      <div className="flex flex-col gap-1">
        <label htmlFor="location" className="text-sm font-medium text-zinc-700">
          Zona {labelOpcional}
        </label>
        <input
          id="location" name="location" type="text"
          value={zona}
          onChange={e => setZona(e.target.value)}
          placeholder="Ej: Palermo, CABA"
          className={inputNormal}
        />
      </div>

      <p className="text-xs text-zinc-500">* Campos obligatorios</p>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
      >
        {pending ? 'Publicando...' : 'Publicar'}
      </button>
    </form>
  )
}
