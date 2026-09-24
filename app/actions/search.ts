'use server'

import { createClient } from '@/lib/supabase/server'
import {
  sanitizarFiltros,
  sanitizarTerminos,
  type SearchFilters,
  type SearchPost,
  type SearchResults,
  type SearchUser,
} from '@/lib/search'

const LIMITE = 20

// Sin fecha_nacimiento: PostCard no la usa y es un dato privado
const postSelect = 'id, user_id, type, title, description, category, modality, presencialidad, temporal_duration, price, price_type, location, created_at, users(username, first_name, rating_avg, avatar_url)'
const userSelect = 'id, first_name, username, headline, location, avatar_url, rating_avg, rating_count'

type FilaRanking = { id: string; puntaje: number; total: number }

// Reordena filas según el orden de ids que devolvió el ranking
// (el .in('id', ids) de Supabase no preserva el orden)
function ordenarPorIds<T extends { id: string }>(filas: T[], ids: string[]): T[] {
  const porId = new Map(filas.map(f => [f.id, f]))
  return ids.map(id => porId.get(id)).filter((f): f is T => !!f)
}

/**
 * Búsqueda full text en publicaciones activas y perfiles.
 * El ranking lo hacen las funciones SQL buscar_posts / buscar_usuarios
 * (supabase/search_functions.sql); acá solo se sanitiza y se traen los datos públicos.
 */
export async function buscar(query: string, filtros?: SearchFilters): Promise<SearchResults> {
  const vacio: SearchResults = { posts: [], users: [], totalPosts: 0, totalUsers: 0, error: null }

  const terminos = sanitizarTerminos(query)
  if (terminos.length === 0) return vacio
  const f = sanitizarFiltros(filtros)

  const supabase = await createClient()

  const [rankPosts, rankUsers] = await Promise.all([
    supabase.rpc('buscar_posts', {
      p_terminos:         terminos,
      p_tipo:             f.tipo ?? null,
      p_categoria:        f.categoria ?? null,
      p_modalidades:      f.modalidades ?? null,
      p_presencialidades: f.presencialidades ?? null,
      p_limite:           LIMITE,
    }),
    supabase.rpc('buscar_usuarios', { p_terminos: terminos, p_limite: LIMITE }),
  ])

  if (rankPosts.error || rankUsers.error) {
    console.error('[buscar] error en ranking', rankPosts.error ?? rankUsers.error)
    return { ...vacio, error: 'No pudimos completar la búsqueda. Probá de nuevo en unos segundos.' }
  }

  const filasPosts = (rankPosts.data ?? []) as FilaRanking[]
  const filasUsers = (rankUsers.data ?? []) as FilaRanking[]
  const idsPosts = filasPosts.map(r => r.id)
  const idsUsers = filasUsers.map(r => r.id)

  const [postsRes, usersRes] = await Promise.all([
    idsPosts.length
      ? supabase.from('posts').select(postSelect).in('id', idsPosts)
      : Promise.resolve({ data: [], error: null }),
    idsUsers.length
      ? supabase.from('users').select(userSelect).in('id', idsUsers)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (postsRes.error || usersRes.error) {
    console.error('[buscar] error trayendo resultados', postsRes.error ?? usersRes.error)
    return { ...vacio, error: 'No pudimos completar la búsqueda. Probá de nuevo en unos segundos.' }
  }

  return {
    posts: ordenarPorIds((postsRes.data ?? []) as unknown as SearchPost[], idsPosts),
    users: ordenarPorIds((usersRes.data ?? []) as SearchUser[], idsUsers),
    // total viene de count(*) over () — cuenta todas las coincidencias, no solo las 20 devueltas
    totalPosts: Number(filasPosts[0]?.total ?? 0),
    totalUsers: Number(filasUsers[0]?.total ?? 0),
    error: null,
  }
}
