import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { avatarBg } from '@/lib/avatar'

const PAGE_SIZE = 20

type SearchParams = Promise<{ page?: string; status?: string; orden?: string }>

// ── Tipos internos ────────────────────────────────────────────────────────────

type AppUser = {
  id: string
  username: string | null
  first_name: string | null
  avatar_url: string | null
  email: string | null
}

type AppPost = {
  id: string
  title: string
  user_id: string
  users: AppUser | null
}

type App = {
  id: string
  status: string
  message: string | null
  created_at: string
  completed_at: string | null
  confirmed_by_client: boolean | null
  confirmed_by_worker: boolean | null
  applicant: AppUser | null
  post: AppPost | null
}

type ConvInfo = { count: number; lastAt: string; convId: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fechaRelativa(iso: string | null | undefined): string {
  if (!iso) return ''
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const horas = Math.floor(diff / 3600000)
  const dias  = Math.floor(diff / 86400000)
  if (mins < 2)   return 'ahora'
  if (mins < 60)  return `hace ${mins} min`
  if (horas < 24) return `hace ${horas}h`
  if (dias === 1) return 'ayer'
  if (dias < 7)   return `hace ${dias} días`
  if (dias < 30)  return `hace ${Math.floor(dias / 7)} sem`
  return `hace ${Math.floor(dias / 30)} meses`
}

function convKey(idA: string, idB: string): string {
  return [idA, idB].sort().join('::')
}

const STATUS_COLOR: Record<string, string> = {
  pendiente: 'bg-amber-500/15 text-amber-400',
  aceptado:  'bg-green-500/15 text-green-400',
  rechazado: 'bg-zinc-800 text-zinc-500',
}

const ORDEN_ESTADO: Record<string, number> = { pendiente: 0, aceptado: 1, rechazado: 2 }

// ── Componente ────────────────────────────────────────────────────────────────

export default async function AdminPostulacionesPage({ searchParams }: { searchParams: SearchParams }) {
  const { page = '1', status = 'todos', orden = 'fecha' } = await searchParams
  const currentPage = Math.max(1, parseInt(page))
  const offset      = (currentPage - 1) * PAGE_SIZE
  const service     = createServiceClient()

  const isSinConv = status === 'sin_conv'
  const isJsMode  = isSinConv || orden !== 'fecha'

  // Cuando usamos ordenamiento/filtrado en JS, traemos hasta 200 filas sin paginar
  let query = service
    .from('applications')
    .select(
      `id, status, message, created_at, completed_at, confirmed_by_client, confirmed_by_worker,
       applicant:users!applicant_id(id, username, first_name, avatar_url, email),
       post:posts!post_id(id, title, user_id, users(id, username, first_name, avatar_url, email))`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  // Filtro de estado
  if (isSinConv) {
    query = query.eq('status', 'aceptado')
  } else if (status !== 'todos') {
    query = query.eq('status', status)
  }

  const { data: rawApps, count: dbCount } = isJsMode
    ? await query.limit(200)
    : await query.range(offset, offset + PAGE_SIZE - 1)

  // Castear
  let apps: App[] = (rawApps ?? []).map(a => ({
    id:                  a.id,
    status:              a.status,
    message:             a.message,
    created_at:          a.created_at,
    completed_at:        (a as unknown as App).completed_at,
    confirmed_by_client: (a as unknown as App).confirmed_by_client,
    confirmed_by_worker: (a as unknown as App).confirmed_by_worker,
    applicant:           a.applicant as unknown as AppUser | null,
    post:                a.post as unknown as AppPost | null,
  }))

  // ── Fetch batch de mensajes y ratings para las apps de esta página ──────────

  const allUserIds = [...new Set(
    apps.flatMap(a => [a.applicant?.id, a.post?.user_id].filter(Boolean) as string[])
  )]

  const [msgResult, ratResult] = allUserIds.length > 0
    ? await Promise.all([
        service.from('messages')
          .select('sender_id, receiver_id, conversation_id, created_at')
          .in('sender_id', allUserIds)
          .in('receiver_id', allUserIds)
          .order('created_at', { ascending: false }),
        service.from('ratings')
          .select('from_user_id, to_user_id, post_id, score')
          .in('from_user_id', allUserIds)
          .in('to_user_id', allUserIds),
      ])
    : [{ data: [] }, { data: [] }]

  // Mapa de conversaciones: convKey(ap, owner) → ConvInfo
  const convMap = new Map<string, ConvInfo>()
  for (const m of (msgResult.data ?? []) as Array<{ sender_id: string; receiver_id: string; conversation_id: string; created_at: string }>) {
    const k = convKey(m.sender_id, m.receiver_id)
    const existing = convMap.get(k)
    if (!existing) {
      convMap.set(k, { count: 1, lastAt: m.created_at, convId: m.conversation_id })
    } else {
      existing.count++
    }
  }

  // Mapa de ratings: convKey(from, to) → score promedio
  const ratByPost = new Map<string, number[]>()
  for (const r of (ratResult.data ?? []) as Array<{ from_user_id: string; to_user_id: string; post_id: string | null; score: number }>) {
    const k = `${convKey(r.from_user_id, r.to_user_id)}::${r.post_id ?? ''}`
    if (!ratByPost.has(k)) ratByPost.set(k, [])
    ratByPost.get(k)!.push(r.score)
  }

  // ── Filtro "sin conversación" ───────────────────────────────────────────────

  if (isSinConv) {
    apps = apps.filter(a => {
      const apId  = a.applicant?.id
      const owId  = a.post?.user_id
      if (!apId || !owId) return false
      return !convMap.has(convKey(apId, owId))
    })
  }

  // ── Ordenamiento JS ────────────────────────────────────────────────────────

  if (orden === 'estado') {
    apps.sort((a, b) => (ORDEN_ESTADO[a.status] ?? 9) - (ORDEN_ESTADO[b.status] ?? 9))
  } else if (orden === 'actividad') {
    // Aceptadas con conversación reciente primero
    apps.sort((a, b) => {
      const kA   = a.applicant?.id && a.post?.user_id ? convKey(a.applicant.id, a.post.user_id) : ''
      const kB   = b.applicant?.id && b.post?.user_id ? convKey(b.applicant.id, b.post.user_id) : ''
      const convA = convMap.get(kA)
      const convB = convMap.get(kB)
      if (convA && !convB) return -1
      if (!convA && convB) return 1
      if (convA && convB) return new Date(convB.lastAt).getTime() - new Date(convA.lastAt).getTime()
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  // ── Paginación JS ──────────────────────────────────────────────────────────

  let paginatedApps: App[]
  let totalPaginas: number
  let totalCount: number

  if (isJsMode) {
    totalCount   = apps.length
    totalPaginas = Math.ceil(totalCount / PAGE_SIZE)
    paginatedApps = apps.slice(offset, offset + PAGE_SIZE)
  } else {
    totalCount   = dbCount ?? 0
    totalPaginas = Math.ceil(totalCount / PAGE_SIZE)
    paginatedApps = apps
  }

  const buildUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams({ page: currentPage.toString(), status, orden, ...params })
    return `/admin/postulaciones?${p.toString()}`
  }

  const FILTROS = [
    { value: 'todos',    label: 'Todas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'aceptado', label: 'Aceptadas' },
    { value: 'rechazado', label: 'Rechazadas' },
    { value: 'sin_conv', label: 'Aceptadas sin conversación' },
  ]

  const ORDENES = [
    { value: 'fecha',      label: 'Más recientes' },
    { value: 'estado',     label: 'Por estado' },
    { value: 'actividad',  label: 'Por actividad' },
  ]

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">← Admin</Link>
      <h1 className="mt-1 text-2xl font-bold text-white">Postulaciones</h1>
      <p className="text-sm text-zinc-500">
        {totalCount.toLocaleString('es-AR')} {isSinConv ? 'aceptadas sin conversación' : 'en total'}
        {isJsMode && <span className="ml-2 text-zinc-600">(máx. 200)</span>}
      </p>

      {/* Filtros de estado */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTROS.map(f => (
          <Link key={f.value} href={buildUrl({ status: f.value, page: '1' })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              status === f.value
                ? f.value === 'sin_conv' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                : 'border border-[#2a2a2a] text-zinc-400 hover:border-zinc-500'
            }`}>
            {f.label}
          </Link>
        ))}
      </div>

      {/* Ordenamiento */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-zinc-600">Orden:</span>
        {ORDENES.map(o => (
          <Link key={o.value} href={buildUrl({ orden: o.value, page: '1' })}
            className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
              orden === o.value ? 'bg-[#252525] text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
            }`}>
            {o.label}
          </Link>
        ))}
      </div>

      {/* Lista */}
      <div className="mt-5 flex flex-col gap-3">
        {paginatedApps.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">Sin resultados.</p>
        )}

        {paginatedApps.map(app => {
          const applicant = app.applicant
          const post      = app.post
          const dueno     = post?.users

          const nombreAp    = applicant?.first_name || applicant?.username || 'Usuario'
          const nombreDueno = dueno?.first_name || dueno?.username || 'Usuario'
          const inicialAp   = (applicant?.first_name || applicant?.username || 'U')[0].toUpperCase()
          const inicialD    = (dueno?.first_name || dueno?.username || 'U')[0].toUpperCase()

          const convInfo = applicant?.id && post?.user_id
            ? convMap.get(convKey(applicant.id, post.user_id))
            : undefined

          const diasDesdeCreacion = Math.floor((Date.now() - new Date(app.created_at).getTime()) / 86400000)
          const esPendienteVieja  = app.status === 'pendiente' && diasDesdeCreacion >= 7
          const completada        = !!app.completed_at

          const ratKey = applicant?.id && post?.user_id
            ? `${convKey(applicant.id, post.user_id)}::${post.id}`
            : null
          const scores = ratKey ? ratByPost.get(ratKey) : null
          const avgScore = scores?.length
            ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
            : null

          return (
            <div key={app.id} className={`rounded-2xl border bg-[#171717] p-4 ${
              esPendienteVieja ? 'border-amber-500/30' : 'border-[#2a2a2a]'
            }`}>

              {/* ── Cabecera: usuarios + estado ── */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 flex-wrap gap-4">

                  {/* Postulante */}
                  <div className="flex items-center gap-2">
                    {applicant?.avatar_url
                      ? <Image src={applicant.avatar_url} width={32} height={32} className="rounded-full object-cover" alt="" />
                      : <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarBg(applicant?.username, applicant?.first_name, applicant?.id)}`}>{inicialAp}</span>
                    }
                    <div>
                      <p className="text-[11px] text-zinc-500">Postulante</p>
                      <Link href={`/perfil/${applicant?.id}`} className="text-sm font-medium text-white hover:underline">{nombreAp}</Link>
                    </div>
                  </div>

                  {/* Dueño */}
                  <div className="flex items-center gap-2">
                    {dueno?.avatar_url
                      ? <Image src={dueno.avatar_url} width={32} height={32} className="rounded-full object-cover" alt="" />
                      : <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarBg(dueno?.username, dueno?.first_name, post?.user_id)}`}>{inicialD}</span>
                    }
                    <div>
                      <p className="text-[11px] text-zinc-500">Publicación de</p>
                      <Link href={`/perfil/${post?.user_id}`} className="text-sm font-medium text-white hover:underline">{nombreDueno}</Link>
                    </div>
                  </div>
                </div>

                {/* Estado + fecha */}
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[app.status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                  <span className="text-xs text-zinc-600">{fechaRelativa(app.created_at)}</span>
                </div>
              </div>

              {/* ── Publicación ── */}
              {post && (
                <Link href={`/post/${post.id}`} className="mt-3 block rounded-xl bg-[#111] px-3 py-2 text-sm text-zinc-300 hover:text-white transition-colors line-clamp-1">
                  📄 {post.title}
                </Link>
              )}

              {/* ── Mensaje expandible ── */}
              {app.message && (
                app.message.length > 150 ? (
                  <details className="mt-2">
                    <summary className="list-none cursor-pointer">
                      <p className="text-xs text-zinc-500 italic line-clamp-2">"{app.message.slice(0, 150)}…" <span className="text-blue-400 not-italic">Ver más</span></p>
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap rounded-xl bg-[#111] px-3 py-2 text-xs text-zinc-400 italic">"{app.message}"</p>
                  </details>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500 italic">"{app.message}"</p>
                )
              )}

              {/* ── Contexto por estado ── */}
              <div className="mt-3 flex flex-wrap items-center gap-2">

                {/* PENDIENTE: alerta si lleva +7 días */}
                {app.status === 'pendiente' && (
                  esPendienteVieja
                    ? <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-400">⚠ Sin responder ({diasDesdeCreacion} días)</span>
                    : <span className="text-xs text-zinc-600">Pendiente {fechaRelativa(app.created_at)}</span>
                )}

                {/* RECHAZADO */}
                {app.status === 'rechazado' && (
                  <span className="text-xs text-zinc-600">Rechazada {fechaRelativa(app.created_at)}</span>
                )}

                {/* ACEPTADO: conversación, completion, rating */}
                {app.status === 'aceptado' && (
                  <>
                    {completada ? (
                      <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs text-green-400">
                        ✓ Completado {fechaRelativa(app.completed_at)}
                      </span>
                    ) : app.confirmed_by_client || app.confirmed_by_worker ? (
                      <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs text-blue-400">
                        Confirmación parcial ({app.confirmed_by_client ? 'cliente ✓' : 'cliente ✗'} / {app.confirmed_by_worker ? 'trabajador ✓' : 'trabajador ✗'})
                      </span>
                    ) : null}

                    {convInfo ? (
                      <span className="rounded-full bg-teal-500/15 px-2.5 py-1 text-xs text-teal-400">
                        💬 {convInfo.count} mensaje{convInfo.count !== 1 ? 's' : ''} · último {fechaRelativa(convInfo.lastAt)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-500">
                        ⚠ Aceptada sin conversación posterior
                      </span>
                    )}

                    {avgScore && (
                      <span className="rounded-full bg-yellow-500/15 px-2.5 py-1 text-xs text-yellow-400">
                        ⭐ {avgScore} ({scores!.length} reseña{scores!.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* ── Contactos internos (solo admin) ── */}
              <details className="mt-3">
                <summary className="list-none cursor-pointer text-[11px] text-zinc-600 hover:text-zinc-400 select-none">
                  Contactos (uso interno) ▸
                </summary>
                <div className="mt-2 grid grid-cols-1 gap-1 rounded-xl border border-[#222] bg-[#111] px-3 py-2 sm:grid-cols-2">
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-600"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <span className="text-[11px] text-zinc-500">{nombreAp}:</span>
                    <span className="text-[11px] text-zinc-300 font-mono">{applicant?.email ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-600"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <span className="text-[11px] text-zinc-500">{nombreDueno}:</span>
                    <span className="text-[11px] text-zinc-300 font-mono">{dueno?.email ?? '—'}</span>
                  </div>
                </div>
              </details>
            </div>
          )
        })}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-between">
          {currentPage > 1
            ? <Link href={buildUrl({ page: String(currentPage - 1) })} className="rounded-xl border border-[#2a2a2a] px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500">← Anterior</Link>
            : <span />}
          <span className="text-xs text-zinc-600">Pág {currentPage} de {totalPaginas}</span>
          {currentPage < totalPaginas
            ? <Link href={buildUrl({ page: String(currentPage + 1) })} className="rounded-xl border border-[#2a2a2a] px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500">Siguiente →</Link>
            : <span />}
        </div>
      )}
    </main>
  )
}
