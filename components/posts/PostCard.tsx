import Link from 'next/link'
import { PRICE_TYPES } from '@/lib/constants'

export type PostCardData = {
  id: string
  type: 'oferta' | 'requerimiento'
  title: string
  description: string | null
  category: string | null
  modality: string[]
  price: number | null
  price_type: string | null
  location: string | null
  created_at: string
  users: { username: string | null; rating_avg: number | null; avatar_url?: string | null } | null
}

const MODALITY_LABEL: Record<string, string> = {
  inmediato:   'Inmediato',
  temporal:    'Temporal',
  por_proyecto:'Por proyecto',
  permanente:  'Permanente',
}

export default function PostCard({ post }: { post: PostCardData }) {
  const priceUnitLabel = PRICE_TYPES.find(p => p.value === post.price_type)?.label ?? ''
  const priceLabel = post.price
    ? `$${post.price.toLocaleString('es-AR')} ${priceUnitLabel}`
    : post.price_type === 'a_convenir'
    ? 'A convenir'
    : null

  const inicial = post.users?.username?.[0]?.toUpperCase() ?? '?'

  return (
    <Link
      href={`/post/${post.id}`}
      className="block rounded-xl border border-surface-2 bg-surface-1 p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {post.modality.includes('inmediato') && (
              <span className="rounded-full bg-green-900/40 px-2 py-0.5 text-xs font-medium text-green-400">
                Inmediato
              </span>
            )}
            {post.category && (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-zinc-400">
                {post.category}
              </span>
            )}
          </div>
          <h3 className="truncate font-semibold leading-snug text-white">{post.title}</h3>
          {post.description && (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{post.description}</p>
          )}
        </div>
        {priceLabel && (
          <p className="shrink-0 text-sm font-semibold text-zinc-200">{priceLabel}</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        {post.users && (
          <span className="flex items-center gap-1.5">
            {post.users.avatar_url ? (
              <img src={post.users.avatar_url} className="h-4 w-4 rounded-full object-cover" alt="" />
            ) : (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-2 text-[10px] text-zinc-400">
                {inicial}
              </span>
            )}
            {post.users.username && <span>@{post.users.username}</span>}
          </span>
        )}
        {post.location && <span>· {post.location}</span>}
        {post.modality.map(m => (
          <span key={m} className="rounded-full bg-surface-2 px-2 py-0.5 text-zinc-400">
            {MODALITY_LABEL[m]}
          </span>
        ))}
      </div>
    </Link>
  )
}
