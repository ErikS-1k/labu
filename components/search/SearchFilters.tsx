'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CATEGORIAS_PUBLICACION, MODALIDADES, PRESENCIALIDADES } from '@/lib/constants'
import { PARAM, contarFiltrosActivos, parseFiltros } from '@/lib/search'
import { useSearchNavigation } from './SearchNavigation'

const LABEL_MODALIDAD: Record<string, string>      = Object.fromEntries(MODALIDADES.map(m => [m.value, m.label]))
const LABEL_PRESENCIALIDAD: Record<string, string> = Object.fromEntries(PRESENCIALIDADES.map(p => [p.value, p.label]))

function IconFiltros() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
    </svg>
  )
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        activo
          ? 'border-blue-500 bg-[rgba(59,130,246,0.15)] text-blue-300'
          : 'border-[#2a2a2a] bg-[#111] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  )
}

function ChipActivo({ label, onQuitar }: { label: string; onQuitar: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(59,130,246,0.4)] bg-[rgba(30,58,138,0.25)] py-1 pl-3 pr-1.5 text-xs font-medium text-blue-300">
      {label}
      <button
        type="button"
        onClick={onQuitar}
        aria-label={`Quitar filtro ${label}`}
        className="flex h-5 w-5 items-center justify-center rounded-full text-blue-300 hover:bg-[rgba(59,130,246,0.25)] hover:text-white"
      >
        ×
      </button>
    </span>
  )
}

// Agrega o quita un valor de una lista y la devuelve como string para la URL (null si queda vacía)
function alternar(lista: string[], valor: string): string | null {
  const nueva = lista.includes(valor) ? lista.filter(v => v !== valor) : [...lista, valor]
  return nueva.length ? nueva.join(',') : null
}

export default function SearchFilters() {
  const searchParams = useSearchParams()
  const { aplicar } = useSearchNavigation()
  const filtros = parseFiltros(searchParams)
  const modalidades      = filtros.modalidades ?? []
  const presencialidades = filtros.presencialidades ?? []
  const activos = contarFiltrosActivos(filtros)

  const [abierto, setAbierto] = useState(false)

  // Si la URL trae una categoría personalizada (ej. "Ingeniería"), sumarla al dropdown
  const categorias = filtros.categoria && !CATEGORIAS_PUBLICACION.includes(filtros.categoria)
    ? [...CATEGORIAS_PUBLICACION, filtros.categoria]
    : CATEGORIAS_PUBLICACION

  function limpiar() {
    aplicar({ [PARAM.categoria]: null, [PARAM.modalidad]: null, [PARAM.presencialidad]: null })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setAbierto(a => !a)}
          aria-expanded={abierto}
          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
            abierto || activos > 0
              ? 'border-zinc-600 bg-surface-2 text-white'
              : 'border-[#2a2a2a] text-zinc-300 hover:bg-surface-2 hover:text-white'
          }`}
        >
          <IconFiltros />
          Filtros
          {activos > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-semibold text-white">
              {activos}
            </span>
          )}
        </button>
        {activos > 0 && (
          <button type="button" onClick={limpiar} className="text-sm text-zinc-500 hover:text-zinc-300">
            Limpiar filtros
          </button>
        )}
      </div>

      {abierto && (
        <div className="flex flex-col gap-5 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="filtro-categoria" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Categoría
            </label>
            <select
              id="filtro-categoria"
              value={filtros.categoria ?? ''}
              onChange={e => aplicar({ [PARAM.categoria]: e.target.value || null })}
              className="rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tipo de trabajo</p>
            <div className="flex flex-wrap gap-2">
              {MODALIDADES.map(m => (
                <Chip
                  key={m.value}
                  activo={modalidades.includes(m.value)}
                  onClick={() => aplicar({ [PARAM.modalidad]: alternar(modalidades, m.value) })}
                >
                  {m.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Modalidad</p>
            <div className="flex flex-wrap gap-2">
              {PRESENCIALIDADES.map(p => (
                <Chip
                  key={p.value}
                  activo={presencialidades.includes(p.value)}
                  onClick={() => aplicar({ [PARAM.presencialidad]: alternar(presencialidades, p.value) })}
                >
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chips de filtros activos — cada uno se puede quitar por separado */}
      {activos > 0 && (
        <div className="flex flex-wrap gap-2">
          {filtros.categoria && (
            <ChipActivo label={filtros.categoria} onQuitar={() => aplicar({ [PARAM.categoria]: null })} />
          )}
          {modalidades.map(m => (
            <ChipActivo
              key={m}
              label={LABEL_MODALIDAD[m]}
              onQuitar={() => aplicar({ [PARAM.modalidad]: alternar(modalidades, m) })}
            />
          ))}
          {presencialidades.map(p => (
            <ChipActivo
              key={p}
              label={LABEL_PRESENCIALIDAD[p]}
              onQuitar={() => aplicar({ [PARAM.presencialidad]: alternar(presencialidades, p) })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
