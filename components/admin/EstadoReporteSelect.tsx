'use client'

import { useState, useTransition } from 'react'
import { cambiarEstadoReporte } from '@/app/actions/reportes'
import { ESTADOS_REPORTE } from '@/lib/reportes'
import { showToast } from '@/lib/toast'

// Dropdown inline para cambiar el estado de un reporte desde /admin/reportes
export default function EstadoReporteSelect({ id, estado }: { id: string; estado: string }) {
  const [valor, setValor] = useState(estado)
  const [pending, startTransition] = useTransition()

  function cambiar(nuevo: string) {
    const anterior = valor
    setValor(nuevo)
    startTransition(async () => {
      const { error } = await cambiarEstadoReporte(id, nuevo)
      if (error) {
        setValor(anterior)
        showToast(error, 'error')
      }
    })
  }

  return (
    <select
      aria-label="Estado del reporte"
      value={valor}
      disabled={pending}
      onChange={e => cambiar(e.target.value)}
      className="rounded-lg border border-[#2a2a2a] bg-[#111] px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-zinc-500 disabled:opacity-60"
    >
      {ESTADOS_REPORTE.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
    </select>
  )
}
