import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAuthUser } from '@/lib/auth'
import { avatarBg } from '@/lib/avatar'
import PageHeader from '@/components/ui/PageHeader'

export const metadata: Metadata = { title: 'Perfil — Labu' }

const MODALITY_LABEL: Record<string, string> = {
  inmediato: 'Inmediato', temporal: 'Temporal', por_proyecto: 'Por proyecto', permanente: 'Permanente',
}

const TIPO_LABEL: Record<string, string> = {
  experiencia: 'Experiencia',
  educacion:   'Educación',
  certificado: 'Certificado',
  proyecto:    'Proyecto',
  curso:       'Curso',
}

const TIPOS_ORDEN = ['experiencia', 'educacion', 'certificado', 'proyecto', 'curso']

// ─── Íconos ───────────────────────────────────────────────────────────────────

function IconMapPin() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
}
function IconCheck() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function IconDoc() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
}
function IconBriefcase() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
}
function IconStar() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}
function IconMegaphone() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ score }: { score: number }) {
  return (
    <span className="text-sm leading-none text-yellow-400" aria-label={`${score} de 5 estrellas`}>
      {'★'.repeat(score)}
      <span className="text-zinc-700">{'★'.repeat(5 - score)}</span>
    </span>
  )
}

function SectionCard({
  icon, iconCls, title, children, id,
}: {
  icon: React.ReactNode
  iconCls: string
  title: string
  children: React.ReactNode
  id?: string
}) {
  return (
    <div id={id} className="flex flex-col gap-4 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconCls}`}>
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

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

  const todasLasResenas = (ratings ?? []) as unknown as RatingData[]
  const tieneSecciones  = Object.keys(seccionesPorTipo).length > 0

  // Botones de acción comunes
  const btnPrimary   = 'flex-1 rounded-xl bg-blue-500 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-600'
  const btnSecondary = 'flex-1 rounded-xl border border-zinc-600 py-2.5 text-center text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white'

  return (
    <main className="mx-auto max-w-2xl px-4 pb-14 pt-8">

      {esPropio && (
        <PageHeader title="Mi perfil" subtitle="Gestioná tu información y trabajos" />
      )}

      {/* ── HERO ── */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/30 to-[#171717] p-6">

        {/* Avatar + info: columna en mobile, fila en desktop */}
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-6">

          {/* Avatar */}
          <div className={`h-24 w-24 shrink-0 overflow-hidden rounded-2xl ${!perfil.avatar_url ? avatarBg(perfil.username, perfil.first_name, perfil.id) : ''}`}>
            {perfil.avatar_url
              ? <Image src={perfil.avatar_url} width={96} height={96} sizes="96px" priority className="object-cover" alt={nombre} />
              : <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">{inicial}</span>
            }
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1 text-center md:text-left">

            {/* Nombre + badge verificado */}
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              {esPropio
                ? <p className="text-2xl font-bold text-white">{nombre}</p>
                : <h1 className="text-2xl font-bold text-white">{nombre}</h1>
              }
              {estaVerif && (
                <span className="flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                  <IconCheck /> Verificado
                </span>
              )}
            </div>

            {/* Username */}
            {perfil.username && (
              <p className="mt-1 text-sm text-zinc-500">@{perfil.username}</p>
            )}

            {/* Rating */}
            {(perfil.rating_count ?? 0) > 0 && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-sm md:justify-start">
                <span className="text-yellow-400">★</span>
                <span className="font-semibold text-white">{perfil.rating_avg}</span>
                <span className="text-zinc-500">· {perfil.rating_count} reseñas</span>
              </p>
            )}

            {/* Titular */}
            {perfil.headline && (
              <p className="mt-2 text-sm font-medium text-zinc-200">{perfil.headline}</p>
            )}

            {/* Zona */}
            {perfil.location && (
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-zinc-500 md:justify-start">
                <IconMapPin />
                {perfil.location}
              </p>
            )}

            {/* Estado de verificación pendiente */}
            {esPropio && pendVerif && (
              <p className="mt-2 text-xs text-zinc-600">Verificación en revisión.</p>
            )}
          </div>
        </div>

        {/* ── Botones de acción ── */}
        <div className="mt-6 flex gap-3">
          {esPropio ? (
            <>
              <Link href="/perfil/editar" className={btnPrimary}>
                Editar perfil
              </Link>
              {estaVerif ? (
                <button
                  disabled
                  className="flex-1 rounded-xl border border-[#2a2a2a] py-2.5 text-sm font-semibold text-zinc-600"
                >
                  ✓ Verificado
                </button>
              ) : (
                <Link
                  href="/verificacion"
                  className={btnSecondary}
                >
                  {pendVerif ? 'Verificación pendiente' : 'Verificar'}
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href={`/mensajes/nuevo?to=${id}`} className={btnPrimary}>
                Enviar mensaje
              </Link>
              {activos && activos.length > 0 ? (
                <a href="#publicaciones" className={btnSecondary}>
                  Ver publicaciones
                </a>
              ) : (
                <button
                  disabled
                  className="flex-1 cursor-not-allowed rounded-xl border border-[#2a2a2a] py-2.5 text-sm font-semibold text-zinc-600"
                >
                  Ver publicaciones
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── BIO ── */}
      {perfil.bio ? (
        <SectionCard
          icon={<IconDoc />}
          iconCls="bg-violet-500/15 text-violet-400"
          title="Sobre"
          id="bio"
        >
          <p className="mt-0 text-sm leading-relaxed text-zinc-300">{perfil.bio}</p>
        </SectionCard>
      ) : esPropio ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#2a2a2a] bg-[#111] p-6 text-center">
          <p className="text-sm text-zinc-500">Todavía no tenés una bio.</p>
          <Link href="/perfil/editar" className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300">
            Agregar bio →
          </Link>
        </div>
      ) : null}

      {/* ── EXPERIENCIA ── */}
      {tieneSecciones ? (
        <div className="mt-4">
          <SectionCard
            icon={<IconBriefcase />}
            iconCls="bg-orange-500/15 text-orange-400"
            title="Experiencia"
          >
            <div className="flex flex-col divide-y divide-[#2a2a2a]">
              {TIPOS_ORDEN.filter(tipo => seccionesPorTipo[tipo]).flatMap(tipo =>
                seccionesPorTipo[tipo]!.map(s => (
                  <div key={s.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                          {TIPO_LABEL[tipo]}
                        </p>
                        {s.url ? (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 block text-sm font-semibold text-white hover:underline"
                          >
                            {s.title}
                          </a>
                        ) : (
                          <p className="mt-0.5 text-sm font-semibold text-white">{s.title}</p>
                        )}
                        {s.subtitle && (
                          <p className="mt-0.5 text-xs text-zinc-400">{s.subtitle}</p>
                        )}
                        {s.description && (
                          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{s.description}</p>
                        )}
                      </div>
                      {(s.date_from || s.date_to) && (
                        <p className="shrink-0 text-xs text-zinc-500">
                          {[s.date_from, s.date_to].filter(Boolean).join(' – ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      ) : esPropio ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#2a2a2a] bg-[#111] p-6 text-center">
          <p className="text-sm text-zinc-500">Todavía no tenés experiencias cargadas.</p>
          <Link href="/perfil/editar" className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300">
            Agregar experiencia →
          </Link>
        </div>
      ) : null}

      {/* ── RESEÑAS ── */}
      <div className="mt-4">
        {todasLasResenas.length > 0 ? (
          <SectionCard
            icon={<IconStar />}
            iconCls="bg-yellow-500/15 text-yellow-400"
            title="Reseñas"
          >
            {/* Promedio destacado */}
            {(perfil.rating_count ?? 0) > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-[#111] px-4 py-3">
                <span className="text-3xl font-bold text-white">{perfil.rating_avg}</span>
                <div>
                  <Stars score={Math.round(Number(perfil.rating_avg))} />
                  <p className="mt-0.5 text-xs text-zinc-500">{perfil.rating_count} calificaciones</p>
                </div>
              </div>
            )}

            {/* Lista compacta */}
            <div className="flex flex-col divide-y divide-[#2a2a2a]">
              {todasLasResenas.slice(0, 3).map(r => (
                <div key={r.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-zinc-200">
                      {r.from_user?.first_name ?? r.from_user?.username ?? 'Usuario'}
                    </p>
                    <Stars score={r.score} />
                  </div>
                  {r.comment && (
                    <p className="mt-1.5 text-xs leading-relaxed italic text-zinc-400">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        ) : (
          <SectionCard
            icon={<IconStar />}
            iconCls="bg-yellow-500/15 text-yellow-400"
            title="Reseñas"
          >
            <p className="text-sm text-zinc-500">Todavía no tiene reseñas.</p>
          </SectionCard>
        )}
      </div>

      {/* ── PUBLICACIONES ACTIVAS ── */}
      {activos && activos.length > 0 ? (
        <div className="mt-4">
          <SectionCard
            icon={<IconMegaphone />}
            iconCls="bg-green-500/15 text-green-400"
            title="Publicaciones activas"
            id="publicaciones"
          >
            <div className="flex flex-col divide-y divide-[#2a2a2a]">
              {activos.map(post => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}?from=perfil&pid=${id}`}
                  className="group py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white transition-colors group-hover:text-blue-400">
                        {post.title}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {post.category && `${post.category} · `}
                        {(post.modality as string[]).map(m => MODALITY_LABEL[m]).join(', ')}
                      </p>
                    </div>
                    <span className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      post.type === 'oferta'
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-orange-500/15 text-orange-400'
                    }`}>
                      {post.type === 'oferta' ? 'Servicio' : 'Búsqueda'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {esPropio && (
              <Link
                href="/publicar"
                className="flex items-center justify-center rounded-xl border border-[#2a2a2a] py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
              >
                + Agregar publicación
              </Link>
            )}
          </SectionCard>
        </div>
      ) : esPropio ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#2a2a2a] bg-[#111] p-6 text-center">
          <p className="text-sm text-zinc-500">Todavía no tenés publicaciones activas.</p>
          <Link href="/publicar" className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300">
            Crear primera publicación →
          </Link>
        </div>
      ) : null}

    </main>
  )
}
