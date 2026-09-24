import { MODALIDADES, PRESENCIALIDADES } from '@/lib/constants'
import type { PostCardData } from '@/components/posts/PostCard'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TipoPost = 'oferta' | 'requerimiento'

export type SearchFilters = {
  tipo?: TipoPost
  categoria?: string
  modalidades?: string[]
  presencialidades?: string[]
}

export type SearchPost = PostCardData

// Solo campos públicos — nunca last_name, phone, email ni fecha_nacimiento
export type SearchUser = {
  id: string
  first_name: string | null
  username: string | null
  headline: string | null
  location: string | null
  avatar_url: string | null
  rating_avg: number | null
  rating_count: number | null
}

export type SearchResults = {
  posts: SearchPost[]
  users: SearchUser[]
  totalPosts: number
  totalUsers: number
  error: string | null
}

// Nombres de los query params de /buscar (listas separadas por coma)
export const PARAM = {
  q: 'q',
  tipo: 'tipo',
  categoria: 'categoria',
  modalidad: 'modalidad',
  presencialidad: 'presencialidad',
  pagina: 'pagina',
} as const

const MODALIDADES_VALIDAS: string[]      = MODALIDADES.map(m => m.value)
const PRESENCIALIDADES_VALIDAS: string[] = PRESENCIALIDADES.map(p => p.value)

// ─── Sanitización ─────────────────────────────────────────────────────────────

// "Profesora de inglés!!" → ['profesora', 'de', 'inglés']
// Solo letras y números (con tildes/ñ): nada que pueda romper la sintaxis de tsquery.
// Las stopwords ("de") las descarta la función SQL.
export function sanitizarTerminos(query: string): string[] {
  const palabras = query
    .toLowerCase()
    .slice(0, 100)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(p => p.length > 0 && p.length <= 30)
  return [...new Set(palabras)].slice(0, 8)
}

// Valida filtros que vienen de afuera (URL o llamada a la server action)
export function sanitizarFiltros(filtros: SearchFilters = {}): SearchFilters {
  const limpio: SearchFilters = {}
  if (filtros.tipo === 'oferta' || filtros.tipo === 'requerimiento') limpio.tipo = filtros.tipo
  const categoria = filtros.categoria?.trim().slice(0, 50)
  if (categoria) limpio.categoria = categoria
  const modalidades = (filtros.modalidades ?? []).filter(m => MODALIDADES_VALIDAS.includes(m))
  if (modalidades.length) limpio.modalidades = [...new Set(modalidades)]
  const presencialidades = (filtros.presencialidades ?? []).filter(p => PRESENCIALIDADES_VALIDAS.includes(p))
  if (presencialidades.length) limpio.presencialidades = [...new Set(presencialidades)]
  return limpio
}

// ─── URL ──────────────────────────────────────────────────────────────────────

function lista(valor: string | null): string[] {
  return (valor ?? '').split(',').map(v => v.trim()).filter(Boolean)
}

// Lee los filtros de los query params. El tipo por defecto es 'oferta' (tab inicial).
export function parseFiltros(params: URLSearchParams): SearchFilters & { tipo: TipoPost } {
  const filtros = sanitizarFiltros({
    tipo: params.get(PARAM.tipo) === 'requerimiento' ? 'requerimiento' : 'oferta',
    categoria: params.get(PARAM.categoria) ?? undefined,
    modalidades: lista(params.get(PARAM.modalidad)),
    presencialidades: lista(params.get(PARAM.presencialidad)),
  })
  return { ...filtros, tipo: filtros.tipo ?? 'oferta' }
}

export function contarFiltrosActivos(filtros: SearchFilters): number {
  return (filtros.categoria ? 1 : 0)
    + (filtros.modalidades?.length ?? 0)
    + (filtros.presencialidades?.length ?? 0)
}
