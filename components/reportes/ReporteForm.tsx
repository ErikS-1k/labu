'use client'

import { useActionState, useState } from 'react'
import { crearReporte, type EstadoReporte } from '@/app/actions/reportes'
import { DESCRIPCION_MAX, DESCRIPCION_MIN, TIPOS_REPORTE } from '@/lib/reportes'

const inicial: EstadoReporte = { error: null }
const campoCls = 'w-full rounded-xl border border-[#2a2a2a] bg-[#111] px-3.5 py-3 text-[15px] text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500'

export default function ReporteForm() {
  const [estado, action, pending] = useActionState(crearReporte, inicial)
  const [tipo, setTipo] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const largo = descripcion.trim().length
  const valido = tipo !== '' && largo >= DESCRIPCION_MIN && largo <= DESCRIPCION_MAX

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="reporte-tipo" className="text-sm font-medium text-zinc-300">Tipo</label>
        <select
          id="reporte-tipo"
          name="tipo"
          required
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          className={campoCls}
        >
          <option value="" disabled>Elegí una opción</option>
          {TIPOS_REPORTE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="reporte-descripcion" className="text-sm font-medium text-zinc-300">Descripción</label>
        <textarea
          id="reporte-descripcion"
          name="descripcion"
          required
          rows={6}
          maxLength={DESCRIPCION_MAX}
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Explicá con el mayor detalle posible..."
          className={`${campoCls} resize-y`}
        />
        <p className={`text-xs ${largo > 0 && largo < DESCRIPCION_MIN ? 'text-amber-400' : 'text-zinc-500'}`}>
          {largo < DESCRIPCION_MIN
            ? `Mínimo ${DESCRIPCION_MIN} caracteres (te faltan ${DESCRIPCION_MIN - largo}).`
            : `${largo} / ${DESCRIPCION_MAX}`}
        </p>
      </div>

      {estado.error && <p className="text-sm text-red-400">{estado.error}</p>}

      <button
        type="submit"
        disabled={!valido || pending}
        className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? 'Enviando…' : 'Enviar reporte'}
      </button>
    </form>
  )
}
