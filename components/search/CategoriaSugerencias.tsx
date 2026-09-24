'use client'

import { PARAM } from '@/lib/search'
import { useSearchNavigation } from './SearchNavigation'

// Categorías populares para el estado sin resultados (value = categoría real en la base)
const POPULARES = [
  { value: 'Educación',         label: 'Educación',  emoji: '📚' },
  { value: 'Oficios',           label: 'Oficios',    emoji: '🔧' },
  { value: 'Tecnología',        label: 'Tecnología', emoji: '💻' },
  { value: 'Salud y bienestar', label: 'Salud',      emoji: '🩺' },
]

// Al tocar una categoría se borran el texto y los demás filtros, y se listan las publicaciones de esa categoría
export default function CategoriaSugerencias() {
  const { aplicar } = useSearchNavigation()

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {POPULARES.map(c => (
        <button
          key={c.value}
          type="button"
          onClick={() => aplicar({
            [PARAM.q]: null,
            [PARAM.categoria]: c.value,
            [PARAM.modalidad]: null,
            [PARAM.presencialidad]: null,
          })}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-[rgba(59,130,246,0.4)] hover:bg-[rgba(30,58,138,0.2)] hover:text-blue-400"
        >
          <span className="text-base leading-none">{c.emoji}</span>
          {c.label}
        </button>
      ))}
    </div>
  )
}
