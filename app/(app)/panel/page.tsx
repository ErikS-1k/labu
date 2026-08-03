import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import PostCard, { type PostCardData } from '@/components/posts/PostCard'
import GuestPublishButtons from '@/components/panel/GuestPublishButtons'
import EmptyFeedState from '@/components/posts/EmptyFeedState'
import OnboardingBanner from '@/components/onboarding/OnboardingBanner'
import PageHeader from '@/components/ui/PageHeader'

export const metadata = { title: 'Inicio — Labu' }

const baseSelect = 'id, user_id, type, title, description, category, modality, presencialidad, temporal_duration, price, price_type, location, created_at, users(username, first_name, fecha_nacimiento, rating_avg, avatar_url)'

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const tipo      = params.tipo
  const busqueda  = params.busqueda
  const categoria = params.categoria
  const modalidad = params.modalidad
  const PAGE_SIZE = 20
  const pagina    = Math.max(0, parseInt(params.pagina ?? '0') || 0)
  const offset    = pagina * PAGE_SIZE

  const supabase   = await createClient()
  const user = await getAuthUser()
  const hayFiltros = tipo || busqueda || categoria || modalidad

  // Datos del usuario para el banner de onboarding
  let step1Done = false
  let step2Done = false
  let step3Done = true // por defecto true para usuarios no logueados
  if (user) {
    const [{ data: perfil }, { count: postsCount }] = await Promise.all([
      supabase
        .from('users')
        .select('first_name, avatar_url, bio, location, first_login')
        .eq('id', user.id)
        .single(),
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ])
    step1Done = !!(perfil?.avatar_url && perfil?.bio && perfil?.location)
    step2Done = (postsCount ?? 0) > 0
    step3Done = !(perfil?.first_login ?? true)
  }
  const allDone = step1Done && step2Done && step3Done

  // Sección "Disponibles ahora" — solo en página 0 sin filtros
  let inmediatos: PostCardData[] = []
  if (!hayFiltros && pagina === 0) {
    const { data } = await supabase
      .from('posts')
      .select(baseSelect)
      .eq('is_active', true)
      .contains('modality', ['inmediato'])
      .order('created_at', { ascending: false })
      .limit(4)
    inmediatos = (data ?? []) as unknown as PostCardData[]
  }

  // Feed principal
  let query = supabase
    .from('posts')
    .select(baseSelect)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (tipo === 'oferta')             query = query.eq('type', 'oferta')
  else if (tipo === 'requerimiento') query = query.eq('type', 'requerimiento')
  if (busqueda)  query = query.or(`title.ilike.%${busqueda}%,description.ilike.%${busqueda}%`)
  if (categoria) query = query.ilike('category', `%${categoria}%`)
  if (modalidad) query = query.contains('modality', [modalidad])

  query = query.range(offset, offset + PAGE_SIZE - 1)
  const { data: posts } = await query
  const inmediatosIds   = pagina === 0 ? new Set(inmediatos.map(p => p.id)) : new Set<string>()
  const feed = ((posts ?? []) as unknown as PostCardData[]).filter(p => !inmediatosIds.has(p.id))

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <PageHeader title="Inicio" subtitle="Descubrí quién puede ayudarte" />
      {user && !allDone && (
        <OnboardingBanner step1Done={step1Done} step2Done={step2Done} step3Done={step3Done} />
      )}

      {/* Banner para visitantes */}
      {!user && (
        <div className="mb-6 rounded-xl border border-surface-2 bg-surface-1 px-5 py-4">
          <p className="text-sm font-semibold text-white">Estás explorando Labu como visitante</p>
          <p className="mt-1 text-sm text-zinc-400">
            Creá una cuenta gratis para publicar tu servicio, buscar trabajo y contactar a otros usuarios.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/registro"
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-surface-2 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-surface-2"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}

      {/* Acciones de publicación — visibles para todos */}
      {user ? (
        <div className="mb-8 grid grid-cols-2 gap-3">
          <Link
            href="/publicar?tipo=oferta"
            className="flex flex-col items-center gap-2 rounded-xl border border-green-800/40 bg-green-900/40 px-4 py-5 text-center transition-colors hover:bg-green-900/60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <span className="text-sm font-semibold text-green-400">Publicar mi servicio</span>
          </Link>
          <Link
            href="/publicar?tipo=requerimiento"
            className="flex flex-col items-center gap-2 rounded-xl border border-blue-800/40 bg-blue-900/40 px-4 py-5 text-center transition-colors hover:bg-blue-900/60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span className="text-sm font-semibold text-blue-400">Publicar una búsqueda</span>
          </Link>
        </div>
      ) : (
        <GuestPublishButtons />
      )}

      {/* Sección inmediatos */}
      {inmediatos.length > 0 && (
        <section className="mt-6 mb-2">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <p className="text-sm font-semibold text-zinc-300">Disponibles ahora</p>
          </div>
          <div className="flex flex-col gap-4">
            {inmediatos.map(p => <PostCard key={p.id} post={p} from="panel" />)}
          </div>
          {feed.length > 0 && (
            <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Todos los posts
            </p>
          )}
        </section>
      )}

      {/* Feed principal */}
      <div className="flex flex-col gap-4 mt-6">
        {feed.map(p => <PostCard key={p.id} post={p} from="panel" />)}

        {/* Feed completamente vacío */}
        {feed.length === 0 && !inmediatos.length && (
          <EmptyFeedState
            busqueda={busqueda}
            tipo={tipo}
            isLoggedIn={!!user}
            hayFiltros={!!hayFiltros}
          />
        )}

      </div>

      {/* Paginación */}
      {(pagina > 0 || feed.length === PAGE_SIZE) && (
        <div className="mt-8 flex items-center justify-between border-t border-surface-2 pt-6">
          {pagina > 0 ? (
            <Link
              href={pagina === 1 ? '/panel' : `/panel?pagina=${pagina - 1}`}
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              ← Anterior
            </Link>
          ) : <span />}
          {feed.length === PAGE_SIZE && (
            <Link
              href={`/panel?pagina=${pagina + 1}`}
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Siguiente →
            </Link>
          )}
        </div>
      )}

    </div>
  )
}
