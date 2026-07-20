import Link from 'next/link'
import { PRICE_TYPES } from '@/lib/constants'
import { avatarBg } from '@/lib/avatar'

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
    rating_avg: number | null
    avatar_url?: string | null
    fecha_nacimiento?: string | null
  } | null
}

function calcularEdad(fecha: string | null | undefined): number | null {
  if (!fecha) return null
  const hoy = new Date()
  const nac = new Date(fecha)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const mDiff = hoy.getMonth() - nac.getMonth()
  if (mDiff < 0 || (mDiff === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

const MODALITY_LABEL: Record<string, string> = {
  inmediato:    'Inmediato',
  temporal:     'Temporal',
  por_proyecto: 'Por proyecto',
  permanente:   'Permanente',
}


const TYPE_CONFIG = {
  oferta:        { label: 'Ofrece sus servicios', badge: 'bg-green-900/40 text-green-400' },
  requerimiento: { label: 'Necesita contratar',   badge: 'bg-blue-900/40 text-blue-400'  },
}

function TypeIcon({ type }: { type: 'oferta' | 'requerimiento' }) {
  if (type === 'oferta') return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  )
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  )
}

export default function PostCard({ post, from }: { post: PostCardData; from?: string }) {
  const priceUnitLabel = PRICE_TYPES.find(p => p.value === post.price_type)?.label ?? ''
  const priceLabel = post.price
    ? `$${post.price.toLocaleString('es-AR')} ${priceUnitLabel}`
    : 'A convenir'

  const nombre     = post.users?.first_name ?? post.users?.username ?? ''
  const inicial    = nombre[0]?.toUpperCase() ?? 'U'
  const edad       = calcularEdad(post.users?.fecha_nacimiento)
  const typeConfig = TYPE_CONFIG[post.type]

  return (
    <div className="relative rounded-xl border border-zinc-700 bg-surface-1 p-5 transition-colors hover:bg-surface-2">
      {/* Stretched link — cubre toda la card, lleva al post */}
      <Link href={`/post/${post.id}${from ? `?from=${from}` : ''}`} className="absolute inset-0 rounded-xl" aria-label={post.title} />

      {/* Badge de tipo */}
      <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${typeConfig.badge}`}>
        <TypeIcon type={post.type} />
        {typeConfig.label}
      </div>

      {/* Usuario + precio */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/perfil/${post.user_id}`}
          className="relative z-10 flex items-center gap-2 min-w-0 hover:underline"
        >
          {post.users?.avatar_url ? (
            <img src={post.users.avatar_url} className="h-6 w-6 shrink-0 rounded-full object-cover" alt="" />
          ) : (
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${avatarBg(post.users?.username, post.users?.first_name, post.user_id, post.id)}`}>
              {inicial}
            </span>
          )}
          {nombre && (
            <span className="truncate text-sm text-zinc-300">
              {nombre}{edad !== null ? `, ${edad}` : ''}
            </span>
          )}
        </Link>
        <span className="shrink-0 text-sm font-semibold text-zinc-100">{priceLabel}</span>
      </div>

      {/* Título */}
      <h3 className="mt-2 text-base font-semibold leading-snug text-white">{post.title}</h3>

      {/* Chips: categoría + modalidades + presencialidad */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {post.category && (
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-zinc-300">
            {post.category}
          </span>
        )}
        {post.modality.map(m => (
          <span key={m} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-zinc-300">
            {MODALITY_LABEL[m] ?? m}
            {m === 'temporal' && post.temporal_duration ? ` · ${post.temporal_duration}` : ''}
          </span>
        ))}
        {post.presencialidad && (
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-zinc-300">
            {post.presencialidad === 'presencial' ? 'Presencial'
             : post.presencialidad === 'virtual' ? 'Virtual'
             : 'Presencial / Virtual'}
          </span>
        )}
      </div>
    </div>
  )
}
