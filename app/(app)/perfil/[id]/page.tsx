import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { avatarBg } from '@/lib/avatar'
import PostCard, { POST_CARD_SELECT, type PostCardData } from '@/components/posts/PostCard'
import SeccionColapsable from '@/components/perfil/SeccionColapsable'

export const metadata: Metadata = { title: 'Perfil — Labu' }

// Jerarquía tipo Airbnb: hero compacto → secciones colapsables → publicaciones siempre visibles

const TIPO_LABEL: Record<string, string> = {
  experiencia: 'Experiencia',
  educacion:   'Educación',
  certificado: 'Certificado',
  proyecto:    'Proyecto',
  curso:       'Curso',
}

const TIPOS_ORDEN = ['experiencia', 'educacion', 'certificado', 'proyecto', 'curso']

// ─── Íconos ───────────────────────────────────────────────────────────────────

function IconStar() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}
function IconShieldCheck() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
}
function IconMapPin() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
}

function Stars({ score }: { score: number }) {
  return (
    <span className="text-sm leading-none text-yellow-400" aria-label={`${score} de 5 estrellas`}>
      {'★'.repeat(score)}
      <span className="text-zinc-700">{'★'.repeat(5 - score)}</span>
    </span>
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
    { data: ratings },
    { data: activosRaw, count: activosCount },
    { data: secciones },
  ] = await Promise.all([
    supabase.from('users')
      .select('id, username, first_name, last_name, headline, bio, location, rating_avg, rating_count, avatar_url')
      .eq('id', id).single(),

    supabase.from('verifications')
      .select('status')
      .eq('user_id', id)
      .maybeSingle(),

    supabase.from('ratings')
      .select('id, score, comment, created_at, from_user:from_user_id(username, first_name)')
      .eq('to_user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase.from('posts')
      .select(POST_CARD_SELECT, { count: 'exact' })
      .eq('user_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase.from('profile_sections')
      .select('id, type, title, subtitle, description, date_from, date_to, url')
      .eq('user_id', id)
      .order('type')
      .order('order'),
  ])

  if (!perfil) notFound()

  // last_name solo en el perfil propio (ver tabla de visibilidad en CLAUDE.md)
  const nombre = esPropio
    ? [perfil.first_name, perfil.last_name].filter(Boolean).join(' ') || perfil.username || 'Usuario'
    : perfil.first_name || perfil.username || 'Usuario'
  const inicial = nombre[0].toUpperCase()

  const estaVerif   = verificacion?.status === 'verificado'
  const ratingCount = perfil.rating_count ?? 0
  const ratingAvg   = Number(perfil.rating_avg ?? 0)

  type Opinion = { id: string; score: number; comment: string | null; from_user: { username: string | null; first_name: string | null } | null }
  const opiniones = (ratings ?? []) as unknown as Opinion[]

  // Toda la trayectoria (experiencia, educación, certificados, proyectos, cursos) va en "Experiencia"
  const items = TIPOS_ORDEN.flatMap(tipo => (secciones ?? []).filter(s => s.type === tipo))

  const activos      = (activosRaw ?? []) as unknown as PostCardData[]
  const totalActivos = activosCount ?? activos.length

  // Chips de confianza: solo los que tienen dato
  const chips: { key: string; contenido: React.ReactNode }[] = []
  if (ratingCount > 0) chips.push({ key: 'rating', contenido: (
    <><span className="text-yellow-400"><IconStar /></span><span className="font-semibold text-white">{ratingAvg.toFixed(1)}</span><span>({ratingCount} {ratingCount === 1 ? 'opinión' : 'opiniones'})</span></>
  ) })
  if (estaVerif) chips.push({ key: 'verif', contenido: (
    <><span className="text-blue-400"><IconShieldCheck /></span><span>Identidad confirmada</span></>
  ) })
  if (perfil.location) chips.push({ key: 'zona', contenido: (
    <><IconMapPin /><span>{perfil.location}</span></>
  ) })

  return (
    <main className="mx-auto max-w-[560px] px-4 pb-14 pt-6 sm:px-6">

      {/* ── HERO ── */}
      <header className="flex flex-col items-center gap-3 pb-6 text-center">
        <div className={`h-[120px] w-[120px] shrink-0 overflow-hidden rounded-full ${!perfil.avatar_url ? avatarBg(perfil.username, perfil.first_name, perfil.id) : ''}`}>
          {perfil.avatar_url
            ? <Image src={perfil.avatar_url} width={120} height={120} sizes="120px" priority className="h-full w-full object-cover" alt={nombre} />
            : <span className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">{inicial}</span>
          }
        </div>

        <div>
          <h1 className="font-serif text-2xl font-medium leading-tight text-white">{nombre}</h1>

          {perfil.headline && (
            <p className="mx-auto mt-1 max-w-[400px] text-[15px] text-white/60">{perfil.headline}</p>
          )}
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/70">
            {chips.map(c => (
              <span key={c.key} className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
                {c.contenido}
              </span>
            ))}
          </div>
        )}

        {/* CTA único */}
        <Link
          href={esPropio ? '/perfil/editar' : `/mensajes/nuevo?to=${id}`}
          className="mt-2 inline-flex h-12 min-w-[240px] items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-12 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          {esPropio ? 'Editar perfil' : 'Contactar'}
        </Link>
      </header>

      {/* ── SECCIONES COLAPSABLES (cada una solo si tiene contenido) ── */}
      <div className="flex flex-col gap-3 empty:hidden">
        {perfil.bio && (
          <SeccionColapsable titulo="Sobre mí" defaultAbierta>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-300">{perfil.bio}</p>
          </SeccionColapsable>
        )}

        {items.length > 0 && (
          <SeccionColapsable titulo="Experiencia">
            <div className="flex flex-col divide-y divide-[#2a2a2a]">
              {items.map(s => (
                <div key={s.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {s.type !== 'experiencia' && (
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{TIPO_LABEL[s.type]}</p>
                      )}
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 block text-sm font-semibold text-white hover:underline">
                          {s.title}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-sm font-semibold text-white">{s.title}</p>
                      )}
                      {s.subtitle && <p className="mt-0.5 text-sm text-zinc-400">{s.subtitle}</p>}
                      {s.description && <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{s.description}</p>}
                    </div>
                    {(s.date_from || s.date_to) && (
                      <p className="shrink-0 text-xs text-zinc-500">
                        {[s.date_from, s.date_to].filter(Boolean).join(' – ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SeccionColapsable>
        )}

        {opiniones.length > 0 && (
          <SeccionColapsable titulo={`Opiniones (${Math.max(ratingCount, opiniones.length)})`}>
            <div className="flex flex-col divide-y divide-[#2a2a2a]">
              {opiniones.map(r => (
                <div key={r.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-200">
                      {r.from_user?.first_name ?? r.from_user?.username ?? 'Usuario'}
                    </p>
                    <Stars score={r.score} />
                  </div>
                  {r.comment && (
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">&ldquo;{r.comment}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </SeccionColapsable>
        )}

      </div>

      {/* ── PUBLICACIONES (siempre visibles) ── */}
      <section id="publicaciones" className="pt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Publicaciones activas{totalActivos > 0 && ` (${totalActivos})`}
        </h2>

        {activos.length > 0 ? (
          <div className="flex flex-col gap-4">
            {activos.map(p => <PostCard key={p.id} post={p} from="perfil" hideAuthor />)}
          </div>
        ) : esPropio ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#2a2a2a] px-6 py-10 text-center">
            <p className="text-sm text-zinc-400">Todavía no publicaste nada</p>
            <Link
              href="/publicar"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Publicar
            </Link>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Todavía no publicó nada</p>
        )}
      </section>

    </main>
  )
}
