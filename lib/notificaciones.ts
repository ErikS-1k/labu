// Notificaciones listas para mostrar (solo servidor). La tabla notifications no guarda quién
// generó cada aviso, así que la persona se deduce del link:
//   nuevo_mensaje        /mensajes/{conv} → quien mandó el último mensaje (y su texto)
//   postulacion_aceptada /post/{id}       → el dueño de la publicación (quien aceptó)
//   nueva_postulacion    /post/{id}       → la solicitud que llegó a esa publicación en ese momento
//   trabajo_completado   /post/{id}       → la otra parte del trabajo (a quien calificar)
// El resto de los tipos se muestra con su ícono y el texto guardado.
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type Actor = { id: string; nombre: string; username: string | null; avatar_url: string | null }

export type NotifItem = {
  key: string
  ids: string[]                 // agrupa avisos del mismo tipo + destino + día
  type: string
  read: boolean
  created_at: string
  actor: Actor | null
  nombre: string | null         // va en negrita al principio del texto
  texto: string                 // resto del texto principal
  subtexto: string | null
  href: string
  cta: string | null            // botón chico a la derecha (ej. "Calificar")
}

type Fila = { id: string; type: string; message: string; link: string | null; read: boolean; created_at: string }

const idDe = (link: string | null, prefijo: string) =>
  link?.startsWith(prefijo) ? link.slice(prefijo.length).split(/[?#/]/)[0] || null : null

export async function cargarNotificaciones(userId: string): Promise<NotifItem[]> {
  const { data } = await createServiceClient()
    .from('notifications')
    .select('id, type, message, link, read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  const filas = (data ?? []) as Fila[]
  if (filas.length === 0) return []

  // Agrupar: mismo tipo + mismo destino + mismo día → una sola fila (la más nueva manda)
  const grupos: { filas: Fila[] }[] = []
  const porClave = new Map<string, { filas: Fila[] }>()
  for (const f of filas) {
    const clave = `${f.type}::${f.link}::${new Date(f.created_at).toDateString()}`
    const g = porClave.get(clave)
    if (g) g.filas.push(f)
    else { const nuevo = { filas: [f] }; porClave.set(clave, nuevo); grupos.push(nuevo) }
  }

  // ── Datos para deducir personas (consultas en lote, con la sesión del usuario: RLS) ──
  const supabase = await createClient()
  const convIds = [...new Set(filas.filter(f => f.type === 'nuevo_mensaje').map(f => idDe(f.link, '/mensajes/')).filter(Boolean))] as string[]
  const postIds = [...new Set(filas.filter(f => f.link?.startsWith('/post/')).map(f => idDe(f.link, '/post/')).filter(Boolean))] as string[]

  const [{ data: mensajes }, { data: posts }, { data: apps }, { data: msgsPosts }] = await Promise.all([
    convIds.length
      ? supabase.from('messages').select('conversation_id, sender_id, content, created_at').in('conversation_id', convIds).neq('sender_id', userId).order('created_at', { ascending: false }).limit(300)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from('posts').select('id, title, user_id').in('id', postIds)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from('applications').select('post_id, applicant_id, status, created_at').in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from('messages').select('conversation_id, post_id, sender_id, receiver_id').in('post_id', postIds).or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).limit(300)
      : Promise.resolve({ data: [] }),
  ])

  type Msg  = { conversation_id: string; sender_id: string; content: string; created_at: string }
  type Post = { id: string; title: string; user_id: string }
  type App  = { post_id: string; applicant_id: string; status: string; created_at: string }
  type MsgP = { conversation_id: string; post_id: string; sender_id: string; receiver_id: string }

  const postPorId = new Map(((posts ?? []) as Post[]).map(p => [p.id, p]))
  const appsPorPost = new Map<string, App[]>()
  for (const a of (apps ?? []) as App[]) appsPorPost.set(a.post_id, [...(appsPorPost.get(a.post_id) ?? []), a])
  // Conversación con una persona sobre una publicación (para "quiere trabajar con vos" → chat)
  const convPorPostYPersona = new Map<string, string>()
  for (const m of (msgsPosts ?? []) as MsgP[]) {
    const otro = m.sender_id === userId ? m.receiver_id : m.sender_id
    convPorPostYPersona.set(`${m.post_id}::${otro}`, m.conversation_id)
  }

  // Último mensaje recibido de cada conversación, anterior (o igual) a la hora del aviso
  const ultimoMensaje = (convId: string, hasta: string) =>
    ((mensajes ?? []) as Msg[]).find(m => m.conversation_id === convId && m.created_at <= new Date(new Date(hasta).getTime() + 5000).toISOString())
      ?? ((mensajes ?? []) as Msg[]).find(m => m.conversation_id === convId)

  // Primer paso: quién es la persona de cada grupo
  const actorIdPorGrupo = new Map<number, string>()
  const extra = new Map<number, { preview?: string; titulo?: string; postId?: string }>()
  grupos.forEach((g, i) => {
    const f = g.filas[0]
    if (f.type === 'nuevo_mensaje') {
      const convId = idDe(f.link, '/mensajes/')
      const m = convId ? ultimoMensaje(convId, f.created_at) : undefined
      if (m) { actorIdPorGrupo.set(i, m.sender_id); extra.set(i, { preview: m.content }) }
      return
    }
    const postId = idDe(f.link, '/post/')
    const post = postId ? postPorId.get(postId) : undefined
    if (!postId) return
    extra.set(i, { titulo: post?.title, postId })
    if (f.type === 'postulacion_aceptada' && post) actorIdPorGrupo.set(i, post.user_id)
    if (f.type === 'nueva_postulacion') {
      // La solicitud de esa publicación más cercana (anterior) a la hora del aviso
      const lista = (appsPorPost.get(postId) ?? []).filter(a => a.created_at <= new Date(new Date(f.created_at).getTime() + 5000).toISOString())
      const a = lista.sort((x, y) => y.created_at.localeCompare(x.created_at))[0]
      if (a) actorIdPorGrupo.set(i, a.applicant_id)
    }
    if (f.type === 'trabajo_completado' && post) {
      if (post.user_id === userId) {
        const aceptada = (appsPorPost.get(postId) ?? []).find(a => a.status === 'aceptado')
        if (aceptada) actorIdPorGrupo.set(i, aceptada.applicant_id)
      } else {
        actorIdPorGrupo.set(i, post.user_id)
      }
    }
  })

  const actorIds = [...new Set(actorIdPorGrupo.values())]
  const { data: usuarios } = actorIds.length
    ? await supabase.from('users').select('id, first_name, username, avatar_url').in('id', actorIds)
    : { data: [] }
  const actorPorId = new Map(((usuarios ?? []) as { id: string; first_name: string | null; username: string | null; avatar_url: string | null }[])
    .map(u => [u.id, { id: u.id, nombre: u.first_name || u.username || 'Alguien', username: u.username, avatar_url: u.avatar_url }]))

  const recortar = (s: string, n = 80) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s)

  // Segundo paso: armar texto, subtexto, destino y CTA
  return grupos.map((g, i) => {
    const f      = g.filas[0]
    const actorId = actorIdPorGrupo.get(i)
    const actor  = actorId ? actorPorId.get(actorId) ?? null : null
    const info   = extra.get(i) ?? {}
    const base: NotifItem = {
      key: f.id,
      ids: g.filas.map(x => x.id),
      type: f.type,
      read: g.filas.every(x => x.read),
      created_at: f.created_at,
      actor: null,
      nombre: null,
      texto: f.message,
      subtexto: null,
      href: f.link || '/notificaciones',
      cta: null,
    }

    if (f.type === 'nuevo_mensaje' && actor) {
      return { ...base, actor, nombre: actor.nombre, texto: 'te escribió', subtexto: info.preview ? recortar(info.preview) : null }
    }
    if (f.type === 'postulacion_aceptada' && actor) {
      const conv = info.postId ? convPorPostYPersona.get(`${info.postId}::${actor.id}`) : undefined
      return {
        ...base, actor, nombre: actor.nombre, texto: 'quiere trabajar con vos',
        subtexto: info.titulo ? `“${info.titulo}”` : null,
        href: conv ? `/mensajes/${conv}` : base.href,
      }
    }
    if (f.type === 'nueva_postulacion' && actor) {
      // A Mi actividad con la publicación resaltada: ahí se ve cuántas solicitudes tiene pendientes
      return {
        ...base, actor, nombre: actor.nombre, texto: 'quiere contactarte',
        subtexto: info.titulo ? `Sobre “${info.titulo}”` : null,
        href: info.postId ? `/mi-actividad?tab=mis-publicaciones&highlight=${info.postId}#post-${info.postId}` : base.href,
      }
    }
    if (f.type === 'trabajo_completado') {
      // Acción del sistema: ícono en vez de avatar
      return {
        ...base, nombre: 'Trabajo terminado', texto: '',
        subtexto: actor ? `Dejale una opinión a ${actor.nombre}` : 'Dejá tu opinión sobre el trabajo',
        cta: 'Calificar',
        // Directo al formulario de calificación del detalle (si la publicación ya no existe,
        // el detalle muestra "Esta publicación ya no está disponible")
        href: info.postId ? `/post/${info.postId}#calificar` : base.href,
      }
    }
    return base
  })
}
