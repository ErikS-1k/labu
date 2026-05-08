import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import VerificacionForm from '@/components/verificacion/VerificacionForm'

export const metadata: Metadata = { title: 'Perfil — Labu' }

const MODALITY_LABEL: Record<string, string> = {
  inmediato: 'Inmediato', temporal: 'Temporal', permanente: 'Permanente',
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
      .select('id, username, first_name, last_name, headline, bio, location, rating_avg, rating_count, created_at')
      .eq('id', id).single(),

    supabase.from('verifications')
      .select('status, type')
      .eq('user_id', id)
      .maybeSingle(),

    supabase.from('posts')
      .select('id, type, title, category, modality, completed_at')
      .eq('user_id', id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(20),

    supabase.from('ratings')
      .select('id, score, comment, created_at, from_user:from_user_id(username, first_name)')
      .eq('to_user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase.from('posts')
      .select('id, type, title, category, modality, price, price_type')
      .eq('user_id', id)
      .eq('is_active', true)
      .is('completed_at', null)
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

  // Agrupar secciones por tipo
  const seccionesPorTipo = TIPOS_ORDEN.reduce<Record<string, typeof secciones>>((acc, tipo) => {
    const grupo = (secciones ?? []).filter(s => s.type === tipo)
    if (grupo.length > 0) acc[tipo] = grupo
    return acc
  }, {})

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">

      {/* Tarjeta de perfil */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-2xl font-bold text-zinc-600">
            {inicial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900">{nombre}</h1>
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
              className="mb-4 inline-block rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              Editar perfil
            </Link>
            {!verificacion && <VerificacionForm userId={id} />}
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
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm transition-shadow hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900">{post.title}</p>
                  <p className="text-xs text-zinc-400">
                    {post.category && `${post.category} · `}
                    {(post.modality as string[]).map(m => MODALITY_LABEL[m]).join(', ')}
                  </p>
                </div>
                <span className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  post.type === 'oferta' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {post.type === 'oferta' ? 'Oferta' : 'Req.'}
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
                  <div key={s.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {s.url ? (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-zinc-900 hover:underline"
                          >
                            {s.title}
                          </a>
                        ) : (
                          <p className="text-sm font-medium text-zinc-900">{s.title}</p>
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

      {/* Historial de trabajos completados */}
      {historial && historial.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Historial ({historial.length})
          </h2>
          <div className="flex flex-col gap-2">
            {historial.map(post => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm transition-shadow hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900">{post.title}</p>
                  <p className="text-xs text-zinc-400">
                    {post.category && `${post.category} · `}
                    Completado {new Date(post.completed_at as string).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <span className="ml-3 shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Completado
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Calificaciones recibidas */}
      {ratings && ratings.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Calificaciones recibidas
          </h2>
          <div className="flex flex-col gap-3">
            {(ratings as any[]).map(r => {
              const quien = r.from_user?.first_name ?? r.from_user?.username ?? 'Usuario'
              return (
                <div key={r.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-800">{quien}</p>
                    <p className="text-sm text-yellow-400">{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</p>
                  </div>
                  {r.comment && (
                    <p className="mt-1 text-sm text-zinc-500">{r.comment}</p>
                  )}
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
                ? 'bg-green-100 text-green-700'
                : p.status === 'rechazado'
                ? 'bg-zinc-100 text-zinc-500'
                : 'bg-yellow-100 text-yellow-700'
              return (
                <Link
                  key={p.id}
                  href={post ? `/post/${post.id}` : '#'}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm transition-shadow hover:shadow-sm"
                >
                  <p className="truncate font-medium text-zinc-900">{post?.title ?? 'Requerimiento'}</p>
                  <span className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                    {statusLabel}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {(!historial || historial.length === 0) && (!ratings || ratings.length === 0) && Object.keys(seccionesPorTipo).length === 0 && (
        <p className="mt-8 text-center text-sm text-zinc-400">
          {esPropio ? 'Todavía no tenés trabajos completados ni calificaciones.' : 'Este usuario no tiene historial todavía.'}
        </p>
      )}
    </main>
  )
}
