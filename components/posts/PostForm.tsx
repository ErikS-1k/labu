'use client'

import { useActionState, useState } from 'react'
import { publicarPost, editarPost } from '@/app/actions/posts'
import { CATEGORIAS_PUBLICACION, MODALIDADES, PRICE_TYPES } from '@/lib/constants'
import { useProgress } from '@/lib/useProgress'

// ─── Estilos compartidos ──────────────────────────────────────────────────────

const inputDark =
  'w-full rounded-xl border border-[#2a2a2a] bg-[#111] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-500'
const inputDarkError =
  'w-full rounded-xl border border-red-500/50 bg-[#111] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none'
const btnSelected =
  'rounded-xl border border-blue-500 bg-blue-500/15 px-3 py-2.5 text-sm font-medium text-blue-400 transition-colors'
const btnUnselected =
  'rounded-xl border border-[#2a2a2a] px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200'

// ─── Íconos de sección ────────────────────────────────────────────────────────

function IconDoc() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
}
function IconTag() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
}
function IconClock() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function IconGlobe() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
}
function IconDollar() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
}
function IconMapPin() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
}
function IconTool() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
}
function IconSearch() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}
function IconMegaphone() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
}
function IconPencil() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
}

// ─── Datos ────────────────────────────────────────────────────────────────────

const CATEGORIAS = [...CATEGORIAS_PUBLICACION, 'Otro']

const PRESENCIALIDAD_OPTS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual',    label: 'Virtual' },
  { value: 'ambos',      label: 'Ambos' },
]

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PostInitialData = {
  type: 'oferta' | 'requerimiento'
  title: string
  description: string | null
  category: string | null
  modality: string[] | null
  presencialidad: string | null
  temporal_duration: string | null
  price: number | null
  price_type: string | null
  location: string | null
}

type Props = {
  defaultTipo?: 'oferta' | 'requerimiento'
  // Título precargado en modo crear (ej. desde "Publicar lo que busco" en /buscar)
  defaultTitulo?: string
  // Modo editar: se pasan ambos. Sin postId el formulario crea una publicación nueva.
  initialData?: PostInitialData
  postId?: string
}

// Categoría guardada → estado del selector (las que no están en la lista van a "Otro")
function categoriaInicial(category: string | null | undefined): { sel: string; custom: string } {
  if (!category) return { sel: '', custom: '' }
  if (CATEGORIAS.includes(category) && category !== 'Otro') return { sel: category, custom: '' }
  return { sel: 'Otro', custom: category }
}

// Cabecera de sección dentro de cada card
function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-500">{icon}</span>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{text}</p>
    </div>
  )
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PostForm({ defaultTipo = 'oferta', defaultTitulo = '', initialData, postId }: Props) {
  const esEdicion = !!postId
  const [state, action, pending]                = useActionState(esEdicion ? editarPost : publicarPost, null)
  useProgress(pending)

  const catInicial = categoriaInicial(initialData?.category)

  // "Más detalles" arranca abierto al editar una publicación que ya tiene alguno de esos datos
  const tieneDetalles = !!initialData && (
    (initialData.modality?.length ?? 0) > 0 || !!initialData.presencialidad ||
    initialData.price != null || !!initialData.location || !!initialData.temporal_duration
  )

  const [tipo, setTipo]                         = useState<'oferta' | 'requerimiento'>(initialData?.type ?? defaultTipo)
  const [titulo, setTitulo]                     = useState(initialData?.title ?? defaultTitulo)
  const [descripcion, setDescripcion]           = useState(initialData?.description ?? '')
  const [catSel, setCatSel]                     = useState(catInicial.sel)
  const [catCustom, setCatCustom]               = useState(catInicial.custom)
  const [precio, setPrecio]                     = useState(initialData?.price != null ? String(initialData.price) : '')
  const [precioTipo, setPrecioTipo]             = useState(
    initialData?.price_type && initialData.price_type !== 'a_convenir' ? initialData.price_type : 'hora'
  )
  // Precio: un solo campo con dos modos. Sin precio cargado = "A convenir".
  const [modoPrecio, setModoPrecio]             = useState<'monto' | 'convenir'>(initialData?.price != null ? 'monto' : 'convenir')
  const [detallesAbiertos, setDetallesAbiertos] = useState(tieneDetalles)
  const [zona, setZona]                         = useState(initialData?.location ?? '')
  const [modalidades, setModalidades]           = useState<string[]>(initialData?.modality ?? [])
  const [temporalDuration, setTemporalDuration] = useState(initialData?.temporal_duration ?? '')
  const [presencialidad, setPresencialidad]     = useState(initialData?.presencialidad ?? '')
  const [fieldErrors, setFieldErrors]           = useState<{ title?: string; description?: string; category?: string; precio?: string }>({})

  function handleTipoChange(nuevoTipo: 'oferta' | 'requerimiento') {
    // El tipo no se puede cambiar una vez creada la publicación
    if (esEdicion) return
    setTipo(nuevoTipo)
    setModalidades([])
    setFieldErrors({})
  }

  function toggleModalidad(value: string, checked: boolean) {
    setModalidades(prev => checked ? [...prev, value] : prev.filter(v => v !== value))
  }

  function cambiarModoPrecio(modo: 'monto' | 'convenir') {
    setModoPrecio(modo)
    if (modo === 'convenir') setPrecio('')
    if (fieldErrors.precio) setFieldErrors(e => ({ ...e, precio: undefined }))
  }

  const categoryValue = catSel === 'Otro' ? catCustom.trim() : catSel
  // Obligatorios: tipo (siempre tiene valor), título, descripción y categoría
  const puedeEnviar = !!titulo.trim() && !!descripcion.trim() && !!categoryValue

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const errors: { title?: string; description?: string; category?: string; precio?: string } = {}
    if (!titulo.trim())      errors.title       = 'Escribí un título'
    if (!descripcion.trim()) errors.description = 'Escribí una descripción'
    if (!categoryValue)      errors.category    = catSel === 'Otro' ? 'Escribí tu categoría' : 'Elegí una categoría'
    if (modoPrecio === 'monto' && !precio) {
      errors.precio = 'Ingresá el monto o elegí "A convenir"'
      setDetallesAbiertos(true)
    }
    if (Object.keys(errors).length > 0) { e.preventDefault(); setFieldErrors(errors); return }
    setFieldErrors({})
  }

  // En edición el botón del tipo no elegido queda apagado y sin interacción
  const tipoBloqueado = 'cursor-not-allowed opacity-40'

  return (
    <>
    {/* Hero — visible en todos los viewports (MobileHeader no cubre /publicar ni /editar) */}
    <div className="mb-10 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20">
        {esEdicion ? <IconPencil /> : <IconMegaphone />}
      </div>
      <h1 className="font-serif text-3xl font-medium text-white">
        {esEdicion ? 'Editá tu publicación' : 'Publicá tu servicio o búsqueda'}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-zinc-400">
        {esEdicion
          ? 'Actualizá los datos y guardá los cambios.'
          : 'Es gratis y tarda menos de un minuto. Empezá a conectar hoy mismo.'}
      </p>
    </div>

    <form action={action} onSubmit={handleSubmit} className="flex flex-col gap-5">

      {esEdicion && <input type="hidden" name="post_id" value={postId} />}

      {/* Error global del server action */}
      {state?.error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}

      {/* ── 1. Selector de tipo ── */}
      <div>
        <p className="mb-3 text-sm font-semibold text-zinc-300">
          {esEdicion ? 'Tipo de publicación' : '¿Qué querés hacer?'}
        </p>
        <input type="hidden" name="type" value={tipo} />
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTipoChange('oferta')}
            disabled={esEdicion && tipo !== 'oferta'}
            aria-disabled={esEdicion}
            className={`rounded-2xl border-2 p-5 text-left transition-all ${
              tipo === 'oferta'
                ? 'border-green-500 bg-green-500/10'
                : `border-[#2a2a2a] bg-[#171717] ${esEdicion ? tipoBloqueado : 'hover:border-zinc-600'}`
            } ${esEdicion ? 'cursor-default' : ''}`}
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
              tipo === 'oferta' ? 'bg-green-500/20 text-green-400' : 'bg-surface-2 text-zinc-400'
            }`}>
              <IconTool />
            </div>
            <p className="text-sm font-bold leading-tight text-white">Ofrezco</p>
            <p className="mt-1 text-xs leading-snug text-zinc-500">
              Ofrecé lo que sabés hacer y encontrá clientes.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleTipoChange('requerimiento')}
            disabled={esEdicion && tipo !== 'requerimiento'}
            aria-disabled={esEdicion}
            className={`rounded-2xl border-2 p-5 text-left transition-all ${
              tipo === 'requerimiento'
                ? 'border-blue-500 bg-blue-500/10'
                : `border-[#2a2a2a] bg-[#171717] ${esEdicion ? tipoBloqueado : 'hover:border-zinc-600'}`
            } ${esEdicion ? 'cursor-default' : ''}`}
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
              tipo === 'requerimiento' ? 'bg-blue-500/20 text-blue-400' : 'bg-surface-2 text-zinc-400'
            }`}>
              <IconSearch />
            </div>
            <p className="text-sm font-bold leading-tight text-white">Busco</p>
            <p className="mt-1 text-xs leading-snug text-zinc-500">
              Publicá qué necesitás y recibí solicitudes.
            </p>
          </button>
        </div>
        {esEdicion && (
          <p className="mt-2 text-xs text-zinc-500">El tipo no se puede cambiar una vez creada la publicación.</p>
        )}
      </div>

      {/* ── 2. Título y descripción ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">
        <SectionLabel icon={<IconDoc />} text="Tu publicación" />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-xs font-medium text-zinc-400">
            Título <span className="text-red-400">*</span>
          </label>
          <input
            id="title" name="title" type="text"
            value={titulo}
            onChange={e => { setTitulo(e.target.value); if (fieldErrors.title) setFieldErrors(er => ({ ...er, title: undefined })) }}
            placeholder="Ej: Clases particulares de Matemática"
            className={fieldErrors.title ? inputDarkError : inputDark}
          />
          {fieldErrors.title && <p className="text-xs text-red-400">{fieldErrors.title}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-xs font-medium text-zinc-400">
            Descripción <span className="text-red-400">*</span>
          </label>
          <textarea
            id="description" name="description" rows={4}
            value={descripcion}
            onChange={e => { setDescripcion(e.target.value); if (fieldErrors.description) setFieldErrors(er => ({ ...er, description: undefined })) }}
            placeholder="Contá qué ofrecés o buscás. Cuanto más detalle, mejor."
            className={`${fieldErrors.description ? inputDarkError : inputDark} resize-none`}
          />
          {fieldErrors.description && <p className="text-xs text-red-400">{fieldErrors.description}</p>}
        </div>
      </div>

      {/* ── 3. Categoría ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">
        <SectionLabel icon={<IconTag />} text="Categoría *" />
        <input type="hidden" name="category" value={categoryValue} />
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCatSel(cat === catSel ? '' : cat)
                if (cat !== 'Otro') setCatCustom('')
                if (fieldErrors.category) setFieldErrors(er => ({ ...er, category: undefined }))
              }}
              className={catSel === cat ? btnSelected : btnUnselected}
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
            className={inputDark}
          />
        )}
        {fieldErrors.category && <p className="text-xs text-red-400">{fieldErrors.category}</p>}
      </div>

      {/* ── 4. Más detalles (opcional) — acordeón ── */}
      <div className="overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#171717]">
        <button
          type="button"
          onClick={() => setDetallesAbiertos(a => !a)}
          aria-expanded={detallesAbiertos}
          aria-controls="mas-detalles"
          className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-white/5"
        >
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold text-white">
              Más detalles <span className="font-normal text-zinc-500">(opcional)</span>
            </span>
            <span className="mt-0.5 block text-sm text-zinc-400">Agregá tipo de trabajo, modalidad, precio y zona</span>
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            className={`shrink-0 text-zinc-400 transition-transform duration-300 ${detallesAbiertos ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Los campos siguen en el DOM aunque esté cerrado: lo cargado se envía igual */}
        <div
          id="mas-detalles"
          className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
            detallesAbiertos ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden" inert={!detallesAbiertos}>
            <div className="flex flex-col divide-y divide-[#2a2a2a] border-t border-[#2a2a2a] px-5">

              {/* Tipo de trabajo (+ por cuánto tiempo si es temporal) */}
              <div className="flex flex-col gap-3 py-5">
                <SectionLabel icon={<IconClock />} text="Tipo de trabajo — podés elegir varios" />
                {modalidades.map(v => <input key={v} type="hidden" name="modality" value={v} />)}
                <div className="flex flex-wrap gap-2">
                  {MODALIDADES.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => toggleModalidad(m.value, !modalidades.includes(m.value))}
                      className={modalidades.includes(m.value) ? btnSelected : btnUnselected}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {modalidades.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    {MODALIDADES.filter(m => modalidades.includes(m.value)).map(m => (
                      <p key={m.value} className="text-xs text-zinc-500">{m.desc}</p>
                    ))}
                  </div>
                )}

                {modalidades.includes('temporal') && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="temporal_duration" className="text-xs font-medium text-zinc-400">Por cuánto tiempo</label>
                    <input
                      id="temporal_duration"
                      type="text"
                      name="temporal_duration"
                      value={temporalDuration}
                      onChange={e => setTemporalDuration(e.target.value)}
                      placeholder="Ej: 3 días, 2 semanas, 1 mes"
                      maxLength={100}
                      className={inputDark}
                    />
                  </div>
                )}
              </div>

              {/* Modalidad (presencial / virtual) */}
              <div className="flex flex-col gap-3 py-5">
                <SectionLabel icon={<IconGlobe />} text="Modalidad" />
                <input type="hidden" name="presencialidad" value={presencialidad} />
                <div className="flex gap-2">
                  {PRESENCIALIDAD_OPTS.map(op => (
                    <button
                      key={op.value}
                      type="button"
                      onClick={() => setPresencialidad(prev => prev === op.value ? '' : op.value)}
                      className={`flex-1 ${presencialidad === op.value ? btnSelected : btnUnselected}`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Precio: un solo campo con dos modos (monto con unidad / a convenir) */}
              <div className="flex flex-col gap-3 py-5">
                <SectionLabel icon={<IconDollar />} text="Precio" />
                <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-1.5">
                  <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label="Cómo cobrás">
                    {([['monto', 'Poner precio'], ['convenir', 'A convenir']] as const).map(([valor, texto]) => (
                      <button
                        key={valor}
                        type="button"
                        role="radio"
                        aria-checked={modoPrecio === valor}
                        onClick={() => cambiarModoPrecio(valor)}
                        className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                          modoPrecio === valor ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {texto}
                      </button>
                    ))}
                  </div>

                  {modoPrecio === 'monto' ? (
                    <div className="mt-1.5 flex gap-2">
                      <input
                        id="price" name="price" type="number" min="0" step="100" inputMode="numeric"
                        aria-label="Monto en pesos"
                        value={precio}
                        onChange={e => { setPrecio(e.target.value); if (fieldErrors.precio) setFieldErrors(er => ({ ...er, precio: undefined })) }}
                        placeholder="$ Ej: 5000"
                        className={`min-w-0 flex-1 ${fieldErrors.precio ? inputDarkError : inputDark}`}
                      />
                      <select
                        id="price_type" name="price_type"
                        aria-label="Unidad del precio"
                        value={precioTipo}
                        onChange={e => setPrecioTipo(e.target.value)}
                        className="w-36 shrink-0 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                      >
                        {PRICE_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                      </select>
                    </div>
                  ) : (
                    <>
                      <input type="hidden" name="price_type" value="a_convenir" />
                      <p className="px-2 pb-1 pt-2.5 text-sm text-zinc-500">El precio se acuerda directamente con la otra persona.</p>
                    </>
                  )}
                </div>
                {fieldErrors.precio && <p className="text-xs text-red-400">{fieldErrors.precio}</p>}
              </div>

              {/* Zona */}
              <div className="flex flex-col gap-3 py-5">
                <SectionLabel icon={<IconMapPin />} text="Zona" />
                <input
                  id="location" name="location" type="text"
                  aria-label="Zona"
                  value={zona}
                  onChange={e => setZona(e.target.value)}
                  placeholder="Ej: Palermo, CABA"
                  className={inputDark}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="mt-2 flex flex-col items-center gap-3">
        <button
          type="submit"
          disabled={pending || !puedeEnviar}
          className="h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {esEdicion
            ? (pending ? 'Guardando…' : 'Guardar cambios')
            : (pending ? 'Publicando…' : 'Publicar')}
        </button>
        <p className="text-xs text-zinc-500">
          {puedeEnviar
            ? 'Podés editar la publicación en cualquier momento.'
            : 'Completá título, descripción y categoría para publicar.'}
        </p>
      </div>
    </form>
    </>
  )
}
