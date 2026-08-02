import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAuthUser } from '@/lib/auth'
import { avatarBg } from '@/lib/avatar'

export const metadata: Metadata = { title: 'Perfil — Labu' }

const MODALITY_LABEL: Record<string, string> = {
  inmediato: 'Inmediato', temporal: 'Temporal', por_proyecto: 'Por proyecto', permanente: 'Permanente',
}

const TIPO_LABEL: Record<string, string> = {
  experiencia: 'Experiencia',
  educacion:   'Educación',
  certificado: 'Certificados',
  proyecto:    'Proyectos',
  curso:       'Cursos',
}

const TIPOS_ORDEN = ['experiencia', 'educacion', 'certificado', 'proyecto', 'curso']

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <h2 className="shrink-0 text-base font-semibold text-white">{title}</h2>
      <div className="flex-1 border-t border-surface-2" />
      {count !== undefined && <span className="shrink-0 text-xs text-zinc-500">{count}</span>}
    </div>
  )
}

function Stars({ score }: { score: number }) {
  return (
    <span className="text-lg leading-none text-yellow-400" aria-label={`${score} de 5 estrellas`}>
      {'★'.repeat(score)}
      <span className="text-zinc-600">{'★'.repeat(5 - score)}</span>
    </span>
  )
}

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getAuthUser()
  const esPropio = user?.id === id

  const [
    { data: perfil },
    { data: verificacion },
    { data: historial },
    { data: ratings },
    { data: activos },
    { data: secciones },
    { data: misPostulaciones },
  ] = await Promise.all([
    supabase.from('users')
      .select('id, username, first_name, last_name, headline, bio, location, rating_avg, rating_count, avatar_url, created_at')
      .eq('id', id).single(),

    supabase.from('verifications')
      .select('status, type')
      .eq('user_id', id)
      .maybeSingle(),

    supabase.from('applications')
      .select('id, completed_at, post_id, posts(id, type, title, category)')
      .eq('applicant_id', id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(20),

    supabase.from('ratings')
      .select('id, score, comment, created_at, post_id, from_user:from_user_id(username, first_name), post:post_id(id, title, user_id)')
      .eq('to_user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase.from('posts')
      .select('id, type, title, category, modality, price, price_type')
      .eq('user_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6),

    supabase.from('profile_sections')
      .select('id, type, title, subtitle, description, date_from, date_to, url')
      .eq('user_id', id)
      .order('type')
      .order('order'),

    ...(esPropio ? [
      supabase.from('applications')
        .select('id, status, created_at, posts(id, title, type)')
        .eq('applicant_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ] : [Promise.resolve({ data: null })]),
  ])

  if (!perfil) notFound()

  // Contador de actividad no leída — solo para perfil propio en mobile
  let actividadCount = 0
  if (esPropio && user) {
    const { count } = await createServiceClient()
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .in('type', ['nueva_postulacion', 'postulacion_aceptada', 'postulacion_rechazada', 'trabajo_completado', 'recordatorio_calificacion'])
    actividadCount = count ?? 0
  }

  const nombre = esPropio
    ? [perfil.first_name, perfil.last_name].filter(Boolean).join(' ') || perfil.username || 'Usuario'
    : perfil.first_name || perfil.username || 'Usuario'

  const inicial   = nombre[0].toUpperCase()
  const estaVerif = verificacion?.status === 'verificado'
  const pendVerif = verificacion?.status === 'pendiente'

  type RatingData = { id: string; score: number; comment: string | null; post_id: string; from_user: { username: string | null; first_name: string | null } | null; post: { id: string; title: string; user_id: string } | null }
  const ratingsPorPost = new Map<string, RatingData>(
    ((ratings ?? []) as unknown as RatingData[]).map(r => [r.post_id, r])
  )
  type HistorialItem = { id: string; completed_at: string; post_id: string; posts: { id: string; type: string; title: string; category: string | null } | null }
  const historialConRating = ((historial ?? []) as unknown as HistorialItem[]).map(job => ({
    ...job,
    rating: ratingsPorPost.get(job.post_id) ?? null,
  }))
  const postIdsEnHistorial = new Set(historialConRating.map(j => j.post_id))
  const ratingsComoCliente = ((ratings ?? []) as unknown as RatingData[]).filter(
    r => !postIdsEnHistorial.has(r.post_id) && r.post?.user_id === id
  )

  const seccionesPorTipo = TIPOS_ORDEN.reduce<Record<string, typeof secciones>>((acc, tipo) => {
    const grupo = (secciones ?? []).filter(s => s.type === tipo)
    if (grupo.length > 0) acc[tipo] = grupo
    return acc
  }, {})

  const totalTrabajos = historialConRating.length + ratingsComoCliente.length
  const sinContenido  = totalTrabajos === 0 && Object.keys(seccionesPorTipo).length === 0

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">

      {/* ── HEADER ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-surface-2 bg-surface-1 p-6">
        <div className="flex items-start gap-5">

          {/* Avatar */}
          <div className={`h-24 w-24 shrink-0 overflow-hidden rounded-2xl ${!perfil.avatar_url ? avatarBg(perfil.username, perfil.first_name, perfil.id) : ''}`}>
            {perfil.avatar_url
              ? <Image src={perfil.avatar_url} width={96} height={96} sizes="96px" priority className="object-cover" alt={nombre} />
              : <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">{inicial}</span>
            }
          </div>

          {/* Info + acciones */}
          <div className="min-w-0 flex-1 pt-1">

            {/* Nombre + badge + botones */}
            <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{nombre}</h1>
                {estaVerif && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-900/40 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                    ✓ Verificado
                  </span>
                )}
              </div>
              {esPropio && (
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <Link
                    href="/perfil/editar"
                    className="rounded-lg border border-surface-2 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-surface-2 hover:text-white"
                  >
                    Editar perfil
                  </Link>
                  {!verificacion && (
                    <Link
                      href="/verificacion"
                      className="rounded-lg border border-surface-2 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-surface-2 hover:text-white"
                    >
                      Verificar
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Username */}
            {perfil.username && (
              <p className="mt-1 text-sm text-zinc-500">@{perfil.username}</p>
            )}

            {/* Rating */}
            {(perfil.rating_count ?? 0) > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-sm">
                <span className="text-base text-yellow-400">★</span>
                <span className="font-semibold text-white">{perfil.rating_avg}</span>
                <span className="text-zinc-500">· {perfil.rating_count} calificaciones</span>
              </p>
            )}

            {/* Headline */}
            {perfil.headline && (
              <p className="mt-2 text-sm font-medium text-zinc-300">{perfil.headline}</p>
            )}

            {/* Location */}
            {perfil.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {perfil.location}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {perfil.bio && (
          <p className="mt-5 border-t border-surface-2 pt-5 text-sm leading-relaxed text-zinc-300">
            {perfil.bio}
          </p>
        )}

        {esPropio && pendVerif && (
          <p className="mt-3 text-xs text-zinc-500">Verificación en revisión.</p>
        )}
      </div>

      {/* ── MI ACTIVIDAD (solo mobile, solo perfil propio) ── */}
      {esPropio && (
        <Link
          href="/mi-actividad"
          className="mt-4 flex items-center justify-between rounded-xl border border-surface-2 bg-surface-1 px-4 py-3 transition-colors hover:bg-surface-2 md:hidden"
        >
          <div className="flex items-center gap-3 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span className="font-medium">Mi actividad</span>
          </div>
          <div className="flex items-center gap-2">
            {actividadCount > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold leading-none text-white">
                {actividadCount > 9 ? '9+' : actividadCount}
              </span>
            )}
            <span className="text-zinc-500">›</span>
          </div>
        </Link>
      )}

      {/* ── PUBLICACIONES ACTIVAS ───────────────────────── */}
      {activos && activos.length > 0 && (
        <section className="mt-8">
          <SectionHeader title="Publicaciones activas" />
          <div className="flex flex-col gap-2">
            {activos.map(post => (
              <Link
                key={post.id}
                href={`/post/${post.id}?from=perfil&pid=${id}`}
                className="flex items-center justify-between rounded-xl border border-surface-2 bg-surface-1 px-4 py-3 transition-colors hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{post.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {post.category && `${post.category} · `}
                    {(post.modality as string[]).map(m => MODALITY_LABEL[m]).join(', ')}
                  </p>
                </div>
                <span className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  post.type === 'oferta' ? 'bg-blue-900/40 text-blue-400' : 'bg-orange-900/40 text-orange-400'
                }`}>
                  {post.type === 'oferta' ? 'Servicio' : 'Búsqueda'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── SECCIONES DEL PERFIL ────────────────────────── */}
      {Object.keys(seccionesPorTipo).length > 0 && (
        <div className="mt-8 flex flex-col gap-8">
          {TIPOS_ORDEN.filter(tipo => seccionesPorTipo[tipo]).map(tipo => (
            <section key={tipo}>
              <SectionHeader title={TIPO_LABEL[tipo]} />
              <div className="flex flex-col gap-2">
                {seccionesPorTipo[tipo]!.map(s => (
                  <div key={s.id} className="rounded-xl border border-surface-2 bg-surface-1 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {s.url ? (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-white hover:underline"
                          >
                            {s.title}
                          </a>
                        ) : (
                          <p className="text-sm font-semibold text-white">{s.title}</p>
                        )}
                        {s.subtitle && (
                          <p className="mt-0.5 text-xs font-medium text-zinc-400">{s.subtitle}</p>
                        )}
                      </div>
                      {(s.date_from || s.date_to) && (
                        <p className="shrink-0 text-xs text-zinc-500">
                          {[s.date_from, s.date_to].filter(Boolean).join(' – ')}
                        </p>
                      )}
                    </div>
                    {s.description && (
                      <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">{s.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── TRABAJOS Y CALIFICACIONES ───────────────────── */}
      {totalTrabajos > 0 && (
        <section className="mt-8">
          <SectionHeader title="Trabajos y calificaciones" count={totalTrabajos} />
          <div className="flex flex-col gap-3">

            {historialConRating.map(job => {
              const p   = job.posts
              const r   = job.rating
              const quien = r?.from_user?.first_name ?? r?.from_user?.username ?? 'Cliente'
              return (
                <div key={job.id} className="rounded-xl border border-surface-2 bg-surface-1 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-medium text-blue-400">Trabajador</p>
                      {p ? (
                        <Link href={`/post/${p.id}?from=perfil&pid=${id}`} className="text-sm font-semibold text-white hover:underline">
                          {p.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-white">Trabajo completado</p>
                      )}
                      {p?.category && (
                        <p className="mt-0.5 text-xs text-zinc-500">{p.category}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {new Date(job.completed_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {r ? (
                    <div className="mt-4 rounded-lg bg-surface-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-200">{quien}</p>
                        <Stars score={r.score} />
                      </div>
                      {r.comment && (
                        <p className="mt-2 text-sm italic leading-relaxed text-zinc-400">&ldquo;{r.comment}&rdquo;</p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-600">Sin calificación</p>
                  )}
                </div>
              )
            })}

            {ratingsComoCliente.map(r => {
              const quien = r.from_user?.first_name ?? r.from_user?.username ?? 'Trabajador'
              return (
                <div key={r.id} className="rounded-xl border border-surface-2 bg-surface-1 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-medium text-orange-400">Cliente</p>
                      {r.post ? (
                        <Link href={`/post/${r.post.id}?from=perfil&pid=${id}`} className="text-sm font-semibold text-white hover:underline">
                          {r.post.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-white">Trabajo completado</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-surface-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-200">{quien}</p>
                      <Stars score={r.score} />
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-sm italic leading-relaxed text-zinc-400">&ldquo;{r.comment}&rdquo;</p>
                    )}
                  </div>
                </div>
              )
            })}

          </div>
        </section>
      )}

      {/* ── MIS POSTULACIONES ───────────────────────────── */}
      {esPropio && misPostulaciones && misPostulaciones.length > 0 && (
        <section className="mt-8">
          <SectionHeader title="Mis postulaciones" count={misPostulaciones.length} />
          <div className="flex flex-col gap-2">
            {(misPostulaciones as any[]).map(p => {
              const post = p.posts as { id: string; title: string; type: string } | null
              const statusConfig = {
                aceptado:  { label: 'Aceptado',  cls: 'bg-green-900/40 text-green-400' },
                rechazado: { label: 'Rechazado', cls: 'bg-red-900/40 text-red-400' },
                pendiente: { label: 'Pendiente', cls: 'bg-yellow-900/40 text-yellow-400' },
              }[p.status as 'aceptado' | 'rechazado' | 'pendiente'] ?? { label: 'Pendiente', cls: 'bg-yellow-900/40 text-yellow-400' }

              return (
                <Link
                  key={p.id}
                  href={post ? `/post/${post.id}?from=perfil&pid=${id}` : '#'}
                  className="flex items-center justify-between rounded-xl border border-surface-2 bg-surface-1 px-4 py-3 transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{post?.title ?? 'Requerimiento'}</p>
                    {post && (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {post.type === 'oferta' ? 'Servicio' : 'Búsqueda'}
                      </p>
                    )}
                  </div>
                  <span className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.cls}`}>
                    {statusConfig.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {sinContenido && (
        <p className="mt-10 text-center text-sm text-zinc-500">
          {esPropio ? 'Todavía no tenés trabajos completados ni calificaciones.' : 'Este usuario no tiene historial todavía.'}
        </p>
      )}

    </main>
  )
}
