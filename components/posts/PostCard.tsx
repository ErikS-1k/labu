import Link from 'next/link'
import { PRICE_TYPES } from '@/lib/constants'

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

const AVATAR_COLORS = [
  'bg-violet-700', 'bg-blue-700', 'bg-emerald-700',
  'bg-amber-700',  'bg-rose-700', 'bg-cyan-700',
]

function avatarBg(username: string | null | undefined): string {
  if (!username) return 'bg-zinc-600'
  return AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length]
}

const TYPE_CONFIG = {
  oferta: {
    label: 'Ofrece sus servicios',
    dot:   'bg-green-400',
    badge: 'bg-green-900/40 text-green-400',
  },
  requerimiento: {
    label: 'Necesita contratar',
    dot:   'bg-blue-400',
    badge: 'bg-blue-900/40 text-blue-400',
  },
}

export default function PostCard({ post }: { post: PostCardData }) {
  const priceUnitLabel = PRICE_TYPES.find(p => p.value === post.price_type)?.label ?? ''
  const priceLabel = post.price
    ? `$${post.price.toLocaleString('es-AR')} ${priceUnitLabel}`
    : 'A convenir'

  const nombre     = post.users?.first_name ?? post.users?.username ?? ''
  const inicial    = nombre[0]?.toUpperCase() ?? 'U'
  const edad       = calcularEdad(post.users?.fecha_nacimiento)
  const typeConfig = TYPE_CONFIG[post.type]

  return (
    <div className="relative rounded-xl border border-surface-2 bg-surface-1 p-4 transition-colors hover:bg-surface-2">
      {/* Stretched link — cubre toda la card, lleva al post */}
      <Link href={`/post/${post.id}`} className="absolute inset-0 rounded-xl" aria-label={post.title} />

      {/* Badge de tipo */}
      <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${typeConfig.badge}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${typeConfig.dot}`} />
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
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${avatarBg(post.users?.username)}`}>
              {inicial}
            </span>
          )}
          {nombre && (
            <span className="truncate text-sm text-zinc-400">
              {nombre}{edad !== null ? `, ${edad}` : ''}
            </span>
          )}
        </Link>
        <span className="shrink-0 text-sm font-semibold text-zinc-200">{priceLabel}</span>
      </div>

      {/* Título */}
      <h3 className="mt-2 font-semibold leading-snug text-white">{post.title}</h3>

      {/* Chips: categoría + modalidades + presencialidad */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {post.category && (
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-zinc-400">
            {post.category}
          </span>
        )}
        {post.modality.map(m => (
          <span key={m} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-zinc-400">
            {MODALITY_LABEL[m] ?? m}
            {m === 'temporal' && post.temporal_duration ? ` · ${post.temporal_duration}` : ''}
          </span>
        ))}
        {post.presencialidad && (
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-zinc-400">
            {post.presencialidad === 'presencial' ? 'Presencial'
             : post.presencialidad === 'virtual' ? 'Virtual'
             : 'Presencial / Virtual'}
          </span>
        )}
      </div>
    </div>
  )
}
