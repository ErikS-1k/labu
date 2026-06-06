import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PostActionsMenu from '@/components/posts/PostActionsMenu'
import CalificarModal from './CalificarModal'
import MarcarCompletadoButton from '@/components/posts/MarcarCompletadoButton'

export const metadata: Metadata = { title: 'Mi actividad — Labu' }

const AVATAR_COLORS = [
  'bg-violet-700', 'bg-blue-700', 'bg-emerald-700',
  'bg-amber-700',  'bg-rose-700', 'bg-cyan-700',
]
function avatarBg(username: string | null | undefined) {
  if (!username) return 'bg-zinc-600'
  return AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length]
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function MiActividadPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; rol?: string }>
}) {
  const sp  = await searchParams
  const tab = sp.tab ?? 'publicaciones'
  const rol = sp.rol ?? 'todos'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── TAB 1: Mis publicaciones ──────────────────────────────────────────────
  let posts: any[] = []
  let countsByPost: Record<string, number> = {}

  if (tab === 'publicaciones') {
    const { data } = await supabase
      .from('posts')
      .select('id, type, title, description, category, modality, is_active, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    posts = data ?? []

    if (posts.length > 0) {
      const { data: apps } = await supabase
        .from('applications')
        .select('post_id')
        .in('post_id', posts.map(p => p.id))

      for (const app of apps ?? []) {
        countsByPost[app.post_id] = (countsByPost[app.post_id] ?? 0) + 1
      }
    }
  }

  // ── TAB 2: Mis trabajos ────────────────────────────────────────────────────
  let trabajos: any[] = []
  let ratingsByPost: Record<string, number> = {}

  if (tab === 'trabajos') {
    const [{ data: aplics }, { data: misRatings }] = await Promise.all([
      supabase
        .from('applications')
        .select(`
          id, status, confirmed_by_client, confirmed_by_worker, completed_at,
          posts!inner(
            id, title, type, user_id,
            users!inner(id, first_name, username, avatar_url)
          )
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('ratings')
        .select('post_id, score')
        .eq('from_user_id', user.id),
    ])

    ratingsByPost = Object.fromEntries((misRatings ?? []).map(r => [r.post_id, r.score]))

    const all = aplics ?? []
    trabajos = rol === 'trabajador'
      ? all.filter(a => (a.posts as any).type === 'requerimiento')
      : rol === 'cliente'
      ? all.filter(a => (a.posts as any).type === 'oferta')
      : all
  }

  const tabClass = (t: string) =>
    `flex-1 py-2.5 text-sm font-medium text-center transition-colors rounded-lg ${
      tab === t
        ? 'bg-surface-2 text-white'
        : 'text-zinc-400 hover:text-zinc-200'
    }`

  const rolClass = (r: string) =>
    `rounded-full px-3 py-1 text-xs font-medium transition-colors ${
      rol === r
        ? 'bg-surface-2 text-white'
        : 'text-zinc-400 hover:text-zinc-200'
    }`

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Mi actividad</h1>
        {tab === 'publicaciones' && (
          <Link
            href="/publicar"
            className="rounded-lg bg-white px-3 py-1.5 text-sm text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            + Publicar
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-surface-0 p-1">
        <Link href="/mi-actividad?tab=publicaciones" className={tabClass('publicaciones')}>
          Mis publicaciones
        </Link>
        <Link href="/mi-actividad?tab=trabajos" className={tabClass('trabajos')}>
          Mis trabajos
        </Link>
      </div>

      {/* ── TAB 1: Mis publicaciones ── */}
      {tab === 'publicaciones' && (
        <>
          {posts.length === 0 ? (
            <div className="rounded-xl border border-surface-2 bg-surface-1 px-6 py-12 text-center">
              <p className="text-zinc-500">Todavía no publicaste nada.</p>
              <Link
                href="/publicar"
                className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-200"
              >
                Crear primera publicación
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {posts.map(post => {
                const appCount = countsByPost[post.id] ?? 0
                const label    = post.type === 'oferta' ? 'Servicio' : 'Búsqueda'
                const modalities = (post.modality as string[] | null) ?? []
                const countLabel = post.type === 'oferta'
                  ? `${appCount} ${appCount === 1 ? 'solicitud' : 'solicitudes'}`
                  : `${appCount} ${appCount === 1 ? 'postulación' : 'postulaciones'}`

                return (
                  <div key={post.id} className="rounded-xl border border-surface-2 bg-surface-1 p-4">
                    {/* Cabecera: badges + menú */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          post.type === 'oferta' ? 'bg-blue-900/40 text-blue-400' : 'bg-orange-900/40 text-orange-400'
                        }`}>
                          {label}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          post.is_active ? 'bg-green-900/40 text-green-400' : 'bg-surface-2 text-zinc-400'
                        }`}>
                          {post.is_active ? 'Activo' : 'Desactivado'}
                        </span>
                        {modalities.map((m: string) => (
                          <span key={m} className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 capitalize">{m}</span>
                        ))}
                      </div>
                      <PostActionsMenu postId={post.id} type={post.type} isActive={post.is_active} />
                    </div>

                    {/* Título — enlaza al detalle */}
                    <Link href={`/post/${post.id}?from=mi-actividad`} className="mt-2 block font-medium leading-snug text-white hover:underline">
                      {post.title}
                    </Link>

                    {/* Descripción */}
                    {post.description && (
                      <p className="mt-2 text-sm leading-relaxed text-zinc-500 line-clamp-3">{post.description}</p>
                    )}

                    {/* Meta */}
                    <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                      {post.category && <span>{post.category}</span>}
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {formatDate(post.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        {countLabel}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: Mis trabajos ── */}
      {tab === 'trabajos' && (
        <>
          {/* Filtro de rol */}
          <div className="mb-4 flex gap-2">
            <Link href="/mi-actividad?tab=trabajos&rol=todos"       className={rolClass('todos')}>Todos</Link>
            <Link href="/mi-actividad?tab=trabajos&rol=trabajador"  className={rolClass('trabajador')}>Como trabajador</Link>
            <Link href="/mi-actividad?tab=trabajos&rol=cliente"     className={rolClass('cliente')}>Como cliente</Link>
          </div>

          {trabajos.length === 0 ? (
            <div className="rounded-xl border border-surface-2 bg-surface-1 px-6 py-12 text-center">
              <p className="text-zinc-500">Todavía no interactuaste con ninguna publicación.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {trabajos.map(app => {
                const post   = app.posts as any
                const autor  = post.users as any
                const rolLabel = post.type === 'requerimiento' ? 'Trabajador' : 'Cliente'
                const yaCalifique = ratingsByPost[post.id]
                const inicial = (autor.first_name ?? autor.username ?? '?')[0].toUpperCase()

                // Badge de estado
                let badgeLabel = ''
                let badgeCls   = ''
                if (app.status === 'pendiente') {
                  badgeLabel = 'Esperando respuesta'
                  badgeCls   = 'bg-surface-2 text-zinc-300'
                } else if (app.status === 'rechazado') {
                  badgeLabel = 'No seleccionado'
                  badgeCls   = 'bg-red-900/40 text-red-400'
                } else if (app.status === 'aceptado' && !app.completed_at) {
                  badgeLabel = 'En curso'
                  badgeCls   = 'bg-blue-900/40 text-blue-400'
                } else if (app.completed_at) {
                  badgeLabel = 'Completado'
                  badgeCls   = 'bg-green-900/40 text-green-400'
                }

                return (
                  <div key={app.id} className="rounded-xl border border-surface-2 bg-surface-1 p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar del autor */}
                      <Link href={`/perfil/${post.user_id}`} className="shrink-0">
                        {autor.avatar_url ? (
                          <img src={autor.avatar_url} className="h-10 w-10 rounded-full object-cover" alt="" />
                        ) : (
                          <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarBg(autor.username)}`}>
                            {inicial}
                          </span>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        {/* Título + badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
                            {badgeLabel}
                          </span>
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                            {rolLabel}
                          </span>
                        </div>
                        <Link href={`/post/${post.id}?from=mi-actividad`} className="font-medium text-white hover:underline leading-snug line-clamp-2">
                          {post.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {autor.first_name ?? autor.username}
                        </p>
                      </div>

                      {/* Acciones */}
                      <div className="shrink-0">
                        {app.status === 'aceptado' && !app.completed_at && (
                          <MarcarCompletadoButton postId={post.id} />
                        )}
                        {app.completed_at && !yaCalifique && (
                          <CalificarModal
                            postId={post.id}
                            toUserId={post.user_id}
                            toUserName={autor.first_name ?? autor.username ?? 'el autor'}
                          />
                        )}
                        {app.completed_at && yaCalifique && (
                          <span className="text-sm text-yellow-400">
                            {'★'.repeat(yaCalifique)}{'☆'.repeat(5 - yaCalifique)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
