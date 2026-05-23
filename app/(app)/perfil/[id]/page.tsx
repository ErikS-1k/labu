import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'

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

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

    // Trabajos completados como trabajador aceptado
    supabase.from('applications')
      .select('id, completed_at, post_id, posts(id, type, title, category)')
      .eq('applicant_id', id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(20),

    // Calificaciones recibidas con contexto del trabajo y del calificador
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

    // Mis postulaciones (solo en perfil propio)
    ...(esPropio ? [
      supabase.from('applications')
        .select('id, status, created_at, posts(id, title, type)')
        .eq('applicant_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ] : [Promise.resolve({ data: null })]),
  ])

  if (!perfil) notFound()

  // Perfil propio: nombre completo. Perfil ajeno: solo primer nombre.
  const nombre = esPropio
    ? [perfil.first_name, perfil.last_name].filter(Boolean).join(' ') || perfil.username || 'Usuario'
    : perfil.first_name || perfil.username || 'Usuario'

  const inicial   = nombre[0].toUpperCase()
  const estaVerif = verificacion?.status === 'verificado'
  const pendVerif = verificacion?.status === 'pendiente'

  // Merge historial + ratings por post_id
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
  // Calificaciones como cliente (no aparecen en el historial de trabajador)
  const ratingsComoCliente = ((ratings ?? []) as unknown as RatingData[]).filter(
    r => !postIdsEnHistorial.has(r.post_id) && r.post?.user_id === id
  )

  // Agrupar secciones por tipo
  const seccionesPorTipo = TIPOS_ORDEN.reduce<Record<string, typeof secciones>>((acc, tipo) => {
    const grupo = (secciones ?? []).filter(s => s.type === tipo)
    if (grupo.length > 0) acc[tipo] = grupo
    return acc
  }, {})

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">

      {/* Tarjeta de perfil */}
      <div className="rounded-xl border border-surface-2 bg-surface-1 p-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-zinc-200">
            {perfil.avatar_url
              ? <img src={perfil.avatar_url} alt={nombre} className="h-full w-full object-cover" />
              : <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-600">{inicial}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-white">{nombre}</h1>
              {estaVerif && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  Verificado
                </span>
              )}
            </div>
            {perfil.headline && (
              <p className="mt-0.5 text-sm font-medium text-zinc-600">{perfil.headline}</p>
            )}
            {perfil.username && (
              <p className="text-sm text-zinc-400">@{perfil.username}</p>
            )}
            {perfil.location && (
              <p className="mt-1 text-sm text-zinc-500">{perfil.location}</p>
            )}
            {(perfil.rating_count ?? 0) > 0 && (
              <p className="mt-1 text-sm text-zinc-500">
                ★ {perfil.rating_avg} · {perfil.rating_count} calificaciones
              </p>
            )}
          </div>
        </div>

        {perfil.bio && (
          <p className="mt-4 text-sm leading-relaxed text-zinc-600">{perfil.bio}</p>
        )}

        {/* Acciones del perfil propio */}
        {esPropio && (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <Link
              href="/perfil/editar"
              className="mb-4 inline-block rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-surface-2"
            >
              Editar perfil
            </Link>
            {!verificacion && (
              <Link
                href="/verificacion"
                className="mb-2 inline-block rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-surface-2"
              >
                Solicitar verificación
              </Link>
            )}
            {pendVerif && (
              <p className="text-sm text-zinc-400">Verificación pendiente de revisión.</p>
            )}
          </div>
        )}
      </div>

      {/* Publicaciones activas */}
      {activos && activos.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Publicaciones activas
          </h2>
          <div className="flex flex-col gap-2">
            {activos.map(post => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="flex items-center justify-between rounded-xl border border-surface-2 bg-surface-1 px-4 py-3 text-sm transition-shadow hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{post.title}</p>
                  <p className="text-xs text-zinc-400">
                    {post.category && `${post.category} · `}
                    {(post.modality as string[]).map(m => MODALITY_LABEL[m]).join(', ')}
                  </p>
                </div>
                <span className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  post.type === 'oferta' ? 'bg-blue-900/40 text-blue-400' : 'bg-orange-900/40 text-orange-400'
                }`}>
                  {post.type === 'oferta' ? 'Servicio' : 'Búsq.'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Secciones del perfil (experiencia, educación, etc.) */}
      {Object.keys(seccionesPorTipo).length > 0 && (
        <section className="mt-6 flex flex-col gap-6">
          {TIPOS_ORDEN.filter(tipo => seccionesPorTipo[tipo]).map(tipo => (
            <div key={tipo}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                {TIPO_LABEL[tipo]}
              </h2>
              <div className="flex flex-col gap-2">
                {seccionesPorTipo[tipo]!.map(s => (
                  <div key={s.id} className="rounded-xl border border-surface-2 bg-surface-1 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {s.url ? (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-white hover:underline"
                          >
                            {s.title}
                          </a>
                        ) : (
                          <p className="text-sm font-medium text-white">{s.title}</p>
                        )}
                        {s.subtitle && (
                          <p className="text-xs text-zinc-500">{s.subtitle}</p>
                        )}
                      </div>
                      {(s.date_from || s.date_to) && (
                        <p className="shrink-0 text-xs text-zinc-400">
                          {[s.date_from, s.date_to].filter(Boolean).join(' – ')}
                        </p>
                      )}
                    </div>
                    {s.description && (
                      <p className="mt-2 text-xs leading-relaxed text-zinc-500">{s.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Trabajos y calificaciones — sección unificada */}
      {(historialConRating.length > 0 || ratingsComoCliente.length > 0) && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Trabajos y calificaciones ({historialConRating.length + ratingsComoCliente.length})
          </h2>
          <div className="flex flex-col gap-3">

            {/* Trabajos como trabajador (con su calificación inline) */}
            {historialConRating.map(job => {
              const p = job.posts
              const r = job.rating
              const quien = r?.from_user?.first_name ?? r?.from_user?.username ?? 'Cliente'
              return (
                <div key={job.id} className="rounded-xl border border-surface-2 bg-surface-1 p-4">
                  {/* Cabecera del trabajo */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Trabajador
                        </span>
                        {p?.category && (
                          <span className="text-xs text-zinc-400">{p.category}</span>
                        )}
                      </div>
                      {p ? (
                        <Link href={`/post/${p.id}`} className="font-medium text-white hover:underline">
                          {p.title}
                        </Link>
                      ) : (
                        <p className="font-medium text-white">Trabajo completado</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {new Date(job.completed_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Calificación recibida */}
                  {r ? (
                    <div className="mt-3 border-t border-zinc-100 pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-zinc-500">
                          Calificado por <span className="font-medium text-zinc-700">{quien}</span> (cliente)
                        </p>
                        <span className="text-sm text-yellow-400">{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</span>
                      </div>
                      {r.comment && (
                        <p className="mt-1 text-sm text-zinc-500">"{r.comment}"</p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-300">Sin calificación</p>
                  )}
                </div>
              )
            })}

            {/* Calificaciones recibidas como cliente */}
            {ratingsComoCliente.map(r => {
              const quien = r.from_user?.first_name ?? r.from_user?.username ?? 'Trabajador'
              return (
                <div key={r.id} className="rounded-xl border border-surface-2 bg-surface-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                          Cliente
                        </span>
                      </div>
                      {r.post ? (
                        <Link href={`/post/${r.post.id}`} className="font-medium text-white hover:underline">
                          {r.post.title}
                        </Link>
                      ) : (
                        <p className="font-medium text-white">Trabajo completado</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 border-t border-zinc-100 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-zinc-500">
                        Calificado por <span className="font-medium text-zinc-700">{quien}</span> (trabajador)
                      </p>
                      <span className="text-sm text-yellow-400">{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</span>
                    </div>
                    {r.comment && (
                      <p className="mt-1 text-sm text-zinc-500">"{r.comment}"</p>
                    )}
                  </div>
                </div>
              )
            })}

          </div>
        </section>
      )}

      {/* Mis postulaciones (solo perfil propio) */}
      {esPropio && misPostulaciones && misPostulaciones.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Mis postulaciones ({misPostulaciones.length})
          </h2>
          <div className="flex flex-col gap-2">
            {(misPostulaciones as any[]).map(p => {
              const post = p.posts as { id: string; title: string; type: string } | null
              const statusLabel = p.status === 'aceptado' ? 'Aceptado' : p.status === 'rechazado' ? 'Rechazado' : 'Pendiente'
              const statusColor = p.status === 'aceptado'
                ? 'bg-green-900/40 text-green-400'
                : p.status === 'rechazado'
                ? 'bg-surface-2 text-zinc-400'
                : 'bg-yellow-900/40 text-yellow-400'
              return (
                <Link
                  key={p.id}
                  href={post ? `/post/${post.id}` : '#'}
                  className="flex items-center justify-between rounded-xl border border-surface-2 bg-surface-1 px-4 py-3 text-sm transition-shadow hover:shadow-sm"
                >
                  <p className="truncate font-medium text-white">{post?.title ?? 'Requerimiento'}</p>
                  <span className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                    {statusLabel}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {historialConRating.length === 0 && ratingsComoCliente.length === 0 && Object.keys(seccionesPorTipo).length === 0 && (
        <p className="mt-8 text-center text-sm text-zinc-400">
          {esPropio ? 'Todavía no tenés trabajos completados ni calificaciones.' : 'Este usuario no tiene historial todavía.'}
        </p>
      )}

      {esPropio && (
        <div className="mt-12 border-t border-zinc-100 pt-6">
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </main>
  )
}
