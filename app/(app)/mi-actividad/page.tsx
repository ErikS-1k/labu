import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import PostActionsMenu from '@/components/posts/PostActionsMenu'
import CalificarModal from './CalificarModal'
import MarcarCompletadoButton from '@/components/posts/MarcarCompletadoButton'
import ActividadRealtimeSync from './ActividadRealtimeSync'
import AutoMarcarActividadLeida from './AutoMarcarActividadLeida'
import PageHeader from '@/components/ui/PageHeader'
import { avatarBg } from '@/lib/avatar'

export const metadata: Metadata = { title: 'Mi actividad — Labu' }

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export default async function MiActividadPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const sp  = await searchParams
  const tab = sp.tab === 'postulaciones' ? 'postulaciones' : 'publicaciones'

  const supabase = await createClient()
  const user = await getAuthUser()

  // ── TAB 1: Mis publicaciones ──────────────────────────────────────────────
  let posts: any[] = []
  let countsByPost: Record<string, number> = {}

  if (tab === 'publicaciones') {
    const { data } = await supabase
      .from('posts')
      .select('id, type, title, category, modality, is_active, created_at')
      .eq('user_id', user!.id)
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

  // ── TAB 2: Mis postulaciones ───────────────────────────────────────────────
  let postulaciones: any[] = []
  let ratingsByPost: Record<string, number> = {}

  if (tab === 'postulaciones') {
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
        .eq('applicant_id', user!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('ratings')
        .select('post_id, score')
        .eq('from_user_id', user!.id),
    ])

    ratingsByPost    = Object.fromEntries((misRatings ?? []).map(r => [r.post_id, r.score]))
    postulaciones    = aplics ?? []
  }

  // ── Estilos de tab ────────────────────────────────────────────────────────
  const tabCls = (t: string) =>
    `flex-1 rounded-xl py-2.5 text-sm font-medium text-center transition-colors ${
      tab === t
        ? 'bg-blue-500 text-white'
        : 'border border-[#2a2a2a] text-zinc-400 hover:bg-[#171717] hover:text-zinc-200'
    }`

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <ActividadRealtimeSync userId={user!.id} />
      <AutoMarcarActividadLeida />

      {/* Título solo en desktop (mobile: MobileHeader) */}
      <PageHeader title="Mi actividad" subtitle="Tus publicaciones y solicitudes" />

      {/* Tabs segmentados */}
      <div className="mb-6 flex gap-2">
        <Link href="/mi-actividad?tab=publicaciones" className={tabCls('publicaciones')}>
          Mis publicaciones
        </Link>
        <Link href="/mi-actividad?tab=postulaciones" className={tabCls('postulaciones')}>
          Mis solicitudes
        </Link>
      </div>

      {/* ── TAB 1: Mis publicaciones ── */}
      {tab === 'publicaciones' && (
        <>
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#171717] px-6 py-14 text-center">
              <p className="text-3xl">📋</p>
              <p className="mt-3 text-sm font-semibold text-zinc-200">Todavía no publicaste nada</p>
              <p className="mt-2 text-sm text-zinc-500">
                Publicá tu servicio para que otros te contraten, o una búsqueda para encontrar a quien necesitás.
              </p>
              <Link
                href="/publicar"
                className="mt-4 inline-block rounded-xl bg-blue-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              >
                Crear publicación
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {posts.map(post => {
                const appCount = countsByPost[post.id] ?? 0
                const countLabel = `${appCount} ${appCount === 1 ? 'solicitud' : 'solicitudes'}`

                return (
                  <div key={post.id} className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4">
                    {/* Header: badges + menú */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          post.type === 'oferta'
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}>
                          {post.type === 'oferta' ? 'Servicio' : 'Búsqueda'}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          post.is_active
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-surface-2 text-zinc-500'
                        }`}>
                          {post.is_active ? 'Visible' : 'Finalizada'}
                        </span>
                      </div>
                      <PostActionsMenu postId={post.id} type={post.type} isActive={post.is_active} />
                    </div>

                    {/* Título */}
                    <Link
                      href={`/post/${post.id}?from=mi-actividad`}
                      className="mt-3 block text-[17px] font-bold leading-snug text-white hover:underline line-clamp-2"
                    >
                      {post.title}
                    </Link>

                    {/* Meta */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                      {post.category && <span>{post.category}</span>}
                      <span>{formatDate(post.created_at)}</span>
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* ── TAB 2: Mis postulaciones ── */}
      {tab === 'postulaciones' && (
        <>
          {postulaciones.length === 0 ? (
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#171717] px-6 py-14 text-center">
              <p className="text-3xl">📨</p>
              <p className="mt-3 text-sm font-semibold text-zinc-200">Todavía no enviaste ninguna solicitud</p>
              <p className="mt-2 text-sm text-zinc-500">
                Cuando le envíes una solicitud a alguien, vas a ver acá cómo va.
              </p>
              <Link
                href="/buscar"
                className="mt-4 inline-block rounded-xl bg-blue-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              >
                Explorar publicaciones
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {postulaciones.map(app => {
                const post  = app.posts as any
                const autor = post.users as any
                const yaCalifique = ratingsByPost[post.id]
                const inicial = (autor.first_name ?? autor.username ?? '?')[0].toUpperCase()

                let badgeLabel = ''
                let badgeCls   = ''
                if (app.status === 'pendiente') {
                  badgeLabel = 'Esperando respuesta'
                  badgeCls   = 'bg-surface-2 text-zinc-400'
                } else if (app.status === 'rechazado') {
                  badgeLabel = 'No seleccionado'
                  badgeCls   = 'bg-orange-500/15 text-orange-400'
                } else if (app.status === 'aceptado' && !app.completed_at) {
                  badgeLabel = 'En curso'
                  badgeCls   = 'bg-blue-500/15 text-blue-400'
                } else if (app.completed_at) {
                  badgeLabel = 'Terminado'
                  badgeCls   = 'bg-green-500/15 text-green-400'
                }

                return (
                  <div key={app.id} className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar del autor de la publicación */}
                      <Link href={`/perfil/${post.user_id}`} className="mt-0.5 shrink-0">
                        {autor.avatar_url ? (
                          <Image
                            src={autor.avatar_url}
                            width={40}
                            height={40}
                            sizes="40px"
                            className="rounded-full object-cover"
                            alt=""
                          />
                        ) : (
                          <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarBg(autor.username, autor.first_name, autor.id)}`}>
                            {inicial}
                          </span>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        {/* Badge de estado */}
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeCls}`}>
                          {badgeLabel}
                        </span>

                        {/* Título de la publicación */}
                        <Link
                          href={`/post/${post.id}?from=mi-actividad`}
                          className="mt-1.5 block font-bold leading-snug text-white hover:underline line-clamp-2"
                        >
                          {post.title}
                        </Link>

                        {/* Autor */}
                        <p className="mt-1 text-xs text-zinc-500">
                          {autor.first_name ?? autor.username}
                        </p>
                      </div>

                      {/* Acciones */}
                      <div className="mt-0.5 shrink-0">
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
