import Link from 'next/link'
import Image from 'next/image'
import { MODALIDADES, PRESENCIALIDADES, PRICE_TYPES } from '@/lib/constants'
import { avatarBg } from '@/lib/avatar'

// Datos que necesita la card. Los del autor son todos públicos (ver tabla de visibilidad en CLAUDE.md).
export const POST_CARD_SELECT =
  'id, user_id, type, title, description, category, modality, presencialidad, temporal_duration, price, price_type, location, created_at, users(username, first_name, headline, location, avatar_url, rating_avg, rating_count)'

export type PostCardData = {
  id: string
  user_id: string
  type: 'oferta' | 'requerimiento'
  title: string
  description: string | null
  category: string | null
  modality: string[]
  presencialidad: string | null
  temporal_duration: string | null
  price: number | null
  price_type: string | null
  location: string | null
  created_at: string
  users: {
    username: string | null
    first_name: string | null
    headline?: string | null
    location?: string | null
    avatar_url?: string | null
    rating_avg: number | null
    rating_count?: number | null
  } | null
}

const MODALITY_LABEL: Record<string, string> = Object.fromEntries(MODALIDADES.map(m => [m.value, m.label]))
const PRESENCIALIDAD_LABEL: Record<string, string> = Object.fromEntries(PRESENCIALIDADES.map(p => [p.value, p.label]))

// ─── Íconos ───────────────────────────────────────────────────────────────────

const iconProps = {
  xmlns: 'http://www.w3.org/2000/svg', width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  className: 'shrink-0', 'aria-hidden': true,
} as const

function IconTag() {
  return <svg {...iconProps}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
}

function IconGlobe() {
  return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
}

function IconClock() {
  return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}

function IconMapPin() {
  return <svg {...iconProps} width={12} height={12}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
}

function IconStar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
// "Mini-perfil con una oferta": persona primero, servicio después.
// Dos zonas clickeables hermanas (no anidadas): autor → /perfil, publicación → /post.
// hideAuthor: oculta la zona del autor (ej. dentro de su propio perfil, donde sería redundante).

export default function PostCard({ post, from, hideAuthor = false }: { post: PostCardData; from?: string; hideAuthor?: boolean }) {
  const autor   = post.users
  const nombre  = autor?.first_name || autor?.username || 'Usuario'
  const inicial = nombre[0]?.toUpperCase() ?? 'U'

  const ratingCount = autor?.rating_count ?? 0
  const ratingAvg   = Number(autor?.rating_avg ?? 0)

  const priceUnitLabel = PRICE_TYPES.find(p => p.value === post.price_type)?.label ?? ''
  const hasPrice       = post.price != null && post.price > 0
  const priceLabel     = hasPrice ? `$${post.price!.toLocaleString('es-AR')}` : 'A convenir'

  const esInmediato   = post.modality.includes('inmediato')
  const tipoTrabajo   = post.modality.map(m => MODALITY_LABEL[m] ?? m).join(', ')
  const modalidad     = post.presencialidad ? PRESENCIALIDAD_LABEL[post.presencialidad] ?? null : null

  // Metadata: categoría · modalidad · tipo de trabajo (solo los que existan)
  const meta: { key: string; icon: React.ReactNode; texto: string; destacado?: boolean }[] = []
  if (post.category) meta.push({ key: 'cat', icon: <IconTag />, texto: post.category })
  if (modalidad)     meta.push({ key: 'mod', icon: <IconGlobe />, texto: modalidad })
  if (tipoTrabajo)   meta.push({ key: 'tipo', icon: <IconClock />, texto: tipoTrabajo, destacado: esInmediato })

  return (
    <article className="overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#171717] transition-colors hover:border-[#3a3a3a]">

      {/* ── Zona autor → perfil ── */}
      {!hideAuthor && (
        <>
          <Link
            href={`/perfil/${post.user_id}`}
            aria-label={`Ver el perfil de ${nombre}`}
            className="flex items-center gap-4 px-5 pb-4 pt-5 transition-colors hover:bg-white/5"
          >
            {autor?.avatar_url ? (
              <Image
                src={autor.avatar_url}
                width={64}
                height={64}
                sizes="64px"
                className="h-16 w-16 shrink-0 rounded-full object-cover"
                alt=""
              />
            ) : (
              <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-white ${avatarBg(autor?.username, autor?.first_name, post.user_id, post.id)}`}>
                {inicial}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[15px] font-semibold text-white">{nombre}</p>
                {ratingCount > 0 && (
                  <span className="flex shrink-0 items-center gap-1 text-sm text-zinc-300" aria-label={`${ratingAvg.toFixed(1)} de 5, ${ratingCount} opiniones`}>
                    <span className="text-yellow-400"><IconStar /></span>
                    <span className="font-medium">{ratingAvg.toFixed(1)}</span>
                    <span className="text-zinc-500">({ratingCount})</span>
                  </span>
                )}
              </div>
              {autor?.headline && (
                <p className="mt-0.5 truncate text-sm text-zinc-400">{autor.headline}</p>
              )}
              {autor?.location && (
                <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-zinc-500">
                  <IconMapPin />
                  <span className="truncate">{autor.location}</span>
                </p>
              )}
            </div>
          </Link>

          {/* Separador entre persona y publicación */}
          <div className="mx-5 border-t border-[#2a2a2a]" />
        </>
      )}

      {/* ── Zona publicación → detalle ── */}
      <Link
        href={`/post/${post.id}${from ? `?from=${from}` : ''}`}
        className={`block px-5 pb-5 transition-colors hover:bg-white/5 ${hideAuthor ? 'pt-5' : 'pt-4'}`}
      >
        <h3 className="line-clamp-2 font-serif text-lg font-medium leading-snug text-white">
          {post.title}
        </h3>

        {post.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {post.description}
          </p>
        )}

        {meta.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-500">
            {meta.map((m, i) => (
              <span key={m.key} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && <span className="text-zinc-700" aria-hidden="true">·</span>}
                <span className={`flex items-center gap-1 ${m.destacado ? 'text-green-400' : ''}`}>
                  {m.icon}
                  {m.texto}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Precio + tipo de publicación */}
        <div className="mt-4 flex items-end justify-between gap-3">
          <p className={hasPrice ? 'text-lg font-semibold text-white' : 'text-base font-medium text-zinc-400'}>
            {priceLabel}
            {hasPrice && priceUnitLabel && (
              <span className="ml-1 text-sm font-normal text-zinc-500">{priceUnitLabel}</span>
            )}
          </p>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            post.type === 'oferta' ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-400'
          }`}>
            {post.type === 'oferta' ? 'Ofrece' : 'Busca'}
          </span>
        </div>
      </Link>
    </article>
  )
}
