import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import ActividadAutoRefresh from './ActividadAutoRefresh'

type Evento = {
  id: string
  tipo: 'usuario' | 'post' | 'postulacion' | 'mensaje' | 'verificacion'
  texto: string
  link: string | null
  created_at: string
}

function fechaRelativa(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const horas = Math.floor(diff / 3600000)
  const dias  = Math.floor(diff / 86400000)
  if (mins < 2)   return 'ahora'
  if (mins < 60)  return `hace ${mins} min`
  if (horas < 24) return `hace ${horas}h`
  if (dias === 1) return 'ayer'
  if (dias < 7)   return `hace ${dias} días`
  return `hace ${Math.floor(dias / 7)} sem`
}

const ICONO: Record<Evento['tipo'], string> = {
  usuario:      '👤',
  post:         '📢',
  postulacion:  '✋',
  mensaje:      '💬',
  verificacion: '🛡️',
}

export default async function AdminActividadPage() {
  const service = createServiceClient()

  const [
    { data: nuevosUsuarios },
    { data: nuevosPosts },
    { data: nuevasApps },
    { data: nuevosMensajes },
    { data: nuevasVerif },
  ] = await Promise.all([
    service.from('users')
      .select('id, first_name, username, created_at')
      .order('created_at', { ascending: false }).limit(20),
    service.from('posts')
      .select('id, title, type, user_id, created_at, users(first_name, username)')
      .order('created_at', { ascending: false }).limit(20),
    service.from('applications')
      .select('id, status, created_at, applicant_id, post_id, applicant:users!applicant_id(first_name, username), post:posts!post_id(title, user_id, users(first_name, username))')
      .order('created_at', { ascending: false }).limit(20),
    service.from('messages')
      .select('id, conversation_id, created_at, sender_id, sender:users!sender_id(first_name, username)')
      .order('created_at', { ascending: false }).limit(20),
    service.from('verifications')
      .select('id, user_id, status, created_at, users(first_name, username)')
      .order('created_at', { ascending: false }).limit(20),
  ])

  const eventos: Evento[] = []

  for (const u of nuevosUsuarios ?? []) {
    eventos.push({
      id: `u-${u.id}`,
      tipo: 'usuario',
      texto: `${u.first_name || u.username || 'Alguien'} se registró en Labu`,
      link: `/perfil/${u.id}`,
      created_at: u.created_at,
    })
  }

  for (const p of nuevosPosts ?? []) {
    const autor = (p.users as unknown as { first_name: string | null; username: string | null } | null)
    eventos.push({
      id: `p-${p.id}`,
      tipo: 'post',
      texto: `${autor?.first_name || autor?.username || 'Alguien'} publicó "${p.title}"`,
      link: `/post/${p.id}`,
      created_at: p.created_at,
    })
  }

  for (const a of nuevasApps ?? []) {
    const ap   = (a.applicant as unknown as { first_name: string | null; username: string | null } | null)
    const post = (a.post as unknown as { title: string; user_id: string; users: { first_name: string | null; username: string | null } | null } | null)
    const dueno = post?.users
    const accion = a.status === 'aceptado' ? 'fue aceptada en' : a.status === 'rechazado' ? 'fue rechazada en' : 'se postuló a'
    eventos.push({
      id: `a-${a.id}`,
      tipo: 'postulacion',
      texto: `${ap?.first_name || ap?.username || 'Alguien'} ${accion} "${post?.title ?? 'una publicación'}" de ${dueno?.first_name || dueno?.username || 'alguien'}`,
      link: a.post_id ? `/post/${a.post_id}` : null,
      created_at: a.created_at,
    })
  }

  // Deduplicar mensajes por conversation_id para evitar spam
  const vistos = new Set<string>()
  for (const m of nuevosMensajes ?? []) {
    if (vistos.has(m.conversation_id)) continue
    vistos.add(m.conversation_id)
    const sender = (m.sender as unknown as { first_name: string | null; username: string | null } | null)
    eventos.push({
      id: `m-${m.id}`,
      tipo: 'mensaje',
      texto: `${sender?.first_name || sender?.username || 'Alguien'} inició o continuó una conversación`,
      link: null,
      created_at: m.created_at,
    })
  }

  for (const v of nuevasVerif ?? []) {
    const user = (v.users as unknown as { first_name: string | null; username: string | null } | null)
    const accion = v.status === 'verificado' ? 'fue verificado/a' : v.status === 'rechazado' ? 'fue rechazado/a' : 'solicitó verificación'
    eventos.push({
      id: `v-${v.id}`,
      tipo: 'verificacion',
      texto: `${user?.first_name || user?.username || 'Alguien'} ${accion}`,
      link: `/perfil/${v.user_id}`,
      created_at: v.created_at,
    })
  }

  // Ordenar por created_at desc y tomar los 50 más recientes
  eventos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const feed = eventos.slice(0, 50)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">← Admin</Link>
      <div className="mt-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Actividad reciente</h1>
          <p className="text-sm text-zinc-500">Últimos 50 eventos de la plataforma</p>
        </div>
        <ActividadAutoRefresh />
      </div>

      <div className="mt-6 flex flex-col gap-1.5">
        {feed.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">No hay actividad reciente.</p>
        )}
        {feed.map(ev => (
          <div key={ev.id} className="flex items-center gap-3 rounded-xl border border-[#222] bg-[#141414] px-4 py-3">
            <span className="text-lg leading-none">{ICONO[ev.tipo]}</span>
            <div className="min-w-0 flex-1">
              {ev.link ? (
                <Link href={ev.link} className="text-sm text-zinc-300 hover:text-white line-clamp-1">
                  {ev.texto}
                </Link>
              ) : (
                <p className="text-sm text-zinc-400 line-clamp-1">{ev.texto}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-zinc-600">{fechaRelativa(ev.created_at)}</span>
          </div>
        ))}
      </div>
    </main>
  )
}
