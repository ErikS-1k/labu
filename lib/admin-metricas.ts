// Métricas del dashboard de /admin (solo servidor, service role).
// Con el volumen actual se calcula todo en memoria a partir de las tablas y se cachea
// 5 minutos (unstable_cache). Cuando la base crezca conviene pasar estos conteos a
// funciones RPC en Postgres.
import { unstable_cache } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

export type Periodo = '7' | '30' | 'todo'

export type Kpi = {
  clave: string
  label: string
  valor: number | null
  detalle: string | null
  // Variación de la semana actual vs la anterior (null = no se puede calcular)
  actual: number
  anterior: number
  destacado?: boolean
}

export type PasoEmbudo = { label: string; valor: number }

export type TopPost  = { id: string; titulo: string; autor: string; solicitudes: number; conversaciones: number }
export type TopUser  = { id: string; nombre: string; email: string | null; avatar_url: string | null; username: string | null; publicaciones: number; solicitudes: number; mensajes: number }

export type Metricas = {
  generado: string
  kpis: Kpi[]
  embudo: Record<Periodo, PasoEmbudo[]>
  topPosts: TopPost[]
  topUsers: TopUser[]
  alertas: { reportes: number | null; verificaciones: number | null; estancadas: number }
}

type User = { id: string; created_at: string; first_name: string | null; username: string | null; email: string | null; avatar_url: string | null; bio: string | null; headline: string | null }
type Post = { id: string; user_id: string; title: string; is_active: boolean; created_at: string }
type App  = { post_id: string; applicant_id: string; status: string; created_at: string }
type Msg  = { conversation_id: string; sender_id: string; receiver_id: string; post_id: string | null; created_at: string }

const DIA = 86400000

// Supabase devuelve como máximo 1000 filas por pedido: se pagina hasta traer todo
async function todas<T>(tabla: string, columnas: string): Promise<T[]> {
  const service = createServiceClient()
  const filas: T[] = []
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await service.from(tabla).select(columnas).range(desde, desde + 999)
    if (error) throw new Error(`[admin-metricas] ${tabla}: ${error.message}`)
    filas.push(...((data ?? []) as T[]))
    if (!data || data.length < 1000) return filas
  }
}

async function contar(tabla: string, columna: string, valor: string): Promise<number | null> {
  const { count, error } = await createServiceClient().from(tabla).select('*', { count: 'exact', head: true }).eq(columna, valor)
  // null = no se pudo contar (ej. la tabla reportes todavía no existe): el dashboard muestra "—"
  return error || count === null ? null : count
}

async function calcular(): Promise<Metricas> {
  const [users, posts, apps, msgs, reportes, verificaciones] = await Promise.all([
    todas<User>('users', 'id, created_at, first_name, username, email, avatar_url, bio, headline'),
    todas<Post>('posts', 'id, user_id, title, is_active, created_at'),
    todas<App>('applications', 'post_id, applicant_id, status, created_at'),
    todas<Msg>('messages', 'conversation_id, sender_id, receiver_id, post_id, created_at'),
    contar('reportes', 'status', 'nuevo'),
    contar('verifications', 'status', 'pendiente'),
  ])

  const ahora      = Date.now()
  const hace7      = ahora - 7 * DIA
  const hace14     = ahora - 14 * DIA
  const inicioHoy  = new Date(new Date().toISOString().slice(0, 10)).getTime() // 00:00 UTC
  const t = (iso: string) => new Date(iso).getTime()
  const enSemana   = (iso: string) => t(iso) >= hace7
  const semanaPrev = (iso: string) => t(iso) >= hace14 && t(iso) < hace7

  // ── Conversaciones: "conexión real" = hay mensajes de los dos participantes ──
  type Conv = { inicio: number; emisores: Set<string>; participantes: Set<string>; postId: string | null; ultimo: number }
  const convs = new Map<string, Conv>()
  for (const m of msgs) {
    const c = convs.get(m.conversation_id) ?? { inicio: Infinity, emisores: new Set(), participantes: new Set(), postId: null, ultimo: 0 }
    c.inicio = Math.min(c.inicio, t(m.created_at))
    c.ultimo = Math.max(c.ultimo, t(m.created_at))
    c.emisores.add(m.sender_id)
    c.participantes.add(m.sender_id); c.participantes.add(m.receiver_id)
    c.postId = c.postId ?? m.post_id
    convs.set(m.conversation_id, c)
  }
  const reales = [...convs.values()].filter(c => c.emisores.size >= 2)

  // ── KPIs ──
  const nuevosUsers  = (f: (iso: string) => boolean) => users.filter(u => f(u.created_at)).length
  const nuevosPosts  = (f: (iso: string) => boolean) => posts.filter(p => f(p.created_at)).length
  const appsEn       = (f: (iso: string) => boolean) => apps.filter(a => f(a.created_at))
  const aceptadas    = apps.filter(a => a.status === 'aceptado').length
  const tasa         = apps.length ? Math.round((aceptadas / apps.length) * 100) : null
  const msgsHoy      = msgs.filter(m => t(m.created_at) >= inicioHoy).length

  const kpis: Kpi[] = [
    { clave: 'usuarios', label: 'Usuarios', valor: users.length, detalle: `+${nuevosUsers(enSemana)} esta semana`, actual: nuevosUsers(enSemana), anterior: nuevosUsers(semanaPrev) },
    { clave: 'posts', label: 'Publicaciones activas', valor: posts.filter(p => p.is_active).length, detalle: `+${nuevosPosts(enSemana)} nuevas esta semana`, actual: nuevosPosts(enSemana), anterior: nuevosPosts(semanaPrev) },
    { clave: 'solicitudes', label: 'Solicitudes esta semana', valor: appsEn(enSemana).length, detalle: `${apps.length} en total`, actual: appsEn(enSemana).length, anterior: appsEn(semanaPrev).length },
    { clave: 'aceptadas', label: 'Solicitudes aceptadas', valor: aceptadas, detalle: tasa === null ? 'Sin solicitudes todavía' : `Tasa de aceptación ${tasa}%`,
      actual: appsEn(enSemana).filter(a => a.status === 'aceptado').length, anterior: appsEn(semanaPrev).filter(a => a.status === 'aceptado').length },
    { clave: 'mensajes', label: 'Mensajes esta semana', valor: msgs.filter(m => enSemana(m.created_at)).length, detalle: `${msgsHoy} hoy`,
      actual: msgs.filter(m => enSemana(m.created_at)).length, anterior: msgs.filter(m => semanaPrev(m.created_at)).length },
    { clave: 'conexiones', label: 'Conexiones reales esta semana', valor: reales.filter(c => c.inicio >= hace7).length, detalle: 'Conversaciones con mensajes de los dos lados',
      actual: reales.filter(c => c.inicio >= hace7).length, anterior: reales.filter(c => c.inicio >= hace14 && c.inicio < hace7).length, destacado: true },
  ]

  // ── Embudo: cohorte de usuarios registrados en el período ──
  const publico     = new Set(posts.map(p => p.user_id))
  const solicito    = new Set(apps.map(a => a.applicant_id))
  const escribio    = new Set(msgs.map(m => m.sender_id))
  const conectado   = new Set(reales.flatMap(c => [...c.participantes]))
  const embudoDe = (desde: number): PasoEmbudo[] => {
    const cohorte = users.filter(u => t(u.created_at) >= desde)
    return [
      { label: 'Se registraron', valor: cohorte.length },
      { label: 'Completaron el perfil', valor: cohorte.filter(u => u.bio && u.headline && u.avatar_url).length },
      { label: 'Hicieron una primera acción', valor: cohorte.filter(u => publico.has(u.id) || solicito.has(u.id) || escribio.has(u.id)).length },
      { label: 'Enviaron al menos 1 solicitud', valor: cohorte.filter(u => solicito.has(u.id)).length },
      { label: 'Tuvieron una conexión real', valor: cohorte.filter(u => conectado.has(u.id)).length },
    ]
  }
  const embudo: Record<Periodo, PasoEmbudo[]> = { '7': embudoDe(hace7), '30': embudoDe(ahora - 30 * DIA), todo: embudoDe(0) }

  // ── Top publicaciones: solicitudes, desempate por conversaciones ──
  const userPorId = new Map(users.map(u => [u.id, u]))
  const solicitudesPorPost = new Map<string, number>()
  for (const a of apps) solicitudesPorPost.set(a.post_id, (solicitudesPorPost.get(a.post_id) ?? 0) + 1)
  const convsPorPost = new Map<string, number>()
  for (const c of convs.values()) if (c.postId) convsPorPost.set(c.postId, (convsPorPost.get(c.postId) ?? 0) + 1)
  const nombreDe = (id: string) => { const u = userPorId.get(id); return u?.first_name || u?.username || 'Usuario' }
  const topPosts: TopPost[] = posts
    .map(p => ({ id: p.id, titulo: p.title, autor: nombreDe(p.user_id), solicitudes: solicitudesPorPost.get(p.id) ?? 0, conversaciones: convsPorPost.get(p.id) ?? 0 }))
    .filter(p => p.solicitudes + p.conversaciones > 0)
    .sort((a, b) => b.solicitudes - a.solicitudes || b.conversaciones - a.conversaciones)
    .slice(0, 5)

  // ── Top usuarios: publicaciones + solicitudes enviadas + mensajes enviados ──
  const cuenta = (lista: string[]) => { const m = new Map<string, number>(); for (const id of lista) m.set(id, (m.get(id) ?? 0) + 1); return m }
  const pubs = cuenta(posts.map(p => p.user_id)), sols = cuenta(apps.map(a => a.applicant_id)), mens = cuenta(msgs.map(m => m.sender_id))
  const topUsers: TopUser[] = users
    .map(u => ({ id: u.id, nombre: u.first_name || u.username || 'Usuario', email: u.email, avatar_url: u.avatar_url, username: u.username,
                 publicaciones: pubs.get(u.id) ?? 0, solicitudes: sols.get(u.id) ?? 0, mensajes: mens.get(u.id) ?? 0 }))
    .filter(u => u.publicaciones + u.solicitudes + u.mensajes > 0)
    .sort((a, b) => (b.publicaciones + b.solicitudes + b.mensajes) - (a.publicaciones + a.solicitudes + a.mensajes))
    .slice(0, 5)

  // ── Alertas: solicitudes aceptadas sin mensajes entre las dos partes en 7 días ──
  const postPorId = new Map(posts.map(p => [p.id, p]))
  const ultimoEntre = new Map<string, number>()
  for (const m of msgs) {
    const clave = [m.sender_id, m.receiver_id].sort().join('::')
    ultimoEntre.set(clave, Math.max(ultimoEntre.get(clave) ?? 0, t(m.created_at)))
  }
  const estancadas = apps.filter(a => {
    if (a.status !== 'aceptado') return false
    const post = postPorId.get(a.post_id)
    if (!post) return false
    const ultimo = ultimoEntre.get([a.applicant_id, post.user_id].sort().join('::')) ?? 0
    return ultimo < hace7
  }).length

  return { generado: new Date().toISOString(), kpis, embudo, topPosts, topUsers, alertas: { reportes, verificaciones, estancadas } }
}

// Cache de 5 minutos: el dashboard no golpea la base en cada visita
export const obtenerMetricas = unstable_cache(calcular, ['admin-metricas'], { revalidate: 300 })
