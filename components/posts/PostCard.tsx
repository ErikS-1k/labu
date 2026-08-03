import Link from 'next/link'
import Image from 'next/image'
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

const MODALITY_LABEL: Record<string, string> = {
  inmediato:    'Inmediato',
  temporal:     'Temporal',
  por_proyecto: 'Por proyecto',
  permanente:   'Permanente',
}

function IconTool() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  )
}

function IconSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function IconClock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function IconGlobe() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

function IconTag() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  )
}

function IconMapPin() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

export default function PostCard({ post, from }: { post: PostCardData; from?: string }) {
  const priceUnitLabel = PRICE_TYPES.find(p => p.value === post.price_type)?.label ?? ''
  const hasPrice       = !!post.price
  const priceLabel     = hasPrice
    ? `$${post.price!.toLocaleString('es-AR')} ${priceUnitLabel}`
    : 'A convenir'

  const nombre   = post.users?.first_name ?? post.users?.username ?? ''
  const inicial  = nombre[0]?.toUpperCase() ?? 'U'

  const esInmediato = post.modality.includes('inmediato')

  // Primera modalidad que no sea inmediato (para la línea de metadata)
  const firstModality = post.modality.filter(m => m !== 'inmediato')[0] ?? null
  const modalityLabel = firstModality ? MODALITY_LABEL[firstModality] ?? firstModality : null

  const presencialidadLabel =
    post.presencialidad === 'presencial' ? 'Presencial'
    : post.presencialidad === 'virtual'  ? 'Virtual'
    : post.presencialidad               ? 'Pres. / Virt.'
    : null

  return (
    <div className="relative rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5 transition-colors hover:border-[#383838]">
      {/* Stretched link — cubre toda la card */}
      <Link
        href={`/post/${post.id}${from ? `?from=${from}` : ''}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={post.title}
      />

      {/* 1. Header: badge + (opcional) dot inmediato | precio */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Badge de tipo */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            post.type === 'oferta'
              ? 'bg-green-900/40 text-green-400'
              : 'bg-blue-900/40 text-blue-400'
          }`}>
            {post.type === 'oferta' ? <IconTool /> : <IconSearch />}
            {post.type === 'oferta' ? 'Ofrece' : 'Busca'}
          </span>

          {/* Dot "Ahora" solo si es inmediato */}
          {esInmediato && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Ahora
            </span>
          )}
        </div>

        {/* Precio */}
        <span className={`shrink-0 text-sm font-semibold ${hasPrice ? 'text-white' : 'text-zinc-500'}`}>
          {priceLabel}
        </span>
      </div>

      {/* 2. Título */}
      <h3 className="mt-3 line-clamp-2 text-[17px] font-bold leading-snug text-white">
        {post.title}
      </h3>

      {/* 3. Info del autor */}
      <div className="mt-3 flex min-w-0 items-center gap-2">
        <Link href={`/perfil/${post.user_id}`} className="relative z-10 flex min-w-0 shrink-0 items-center gap-2 hover:underline">
          {post.users?.avatar_url ? (
            <Image
              src={post.users.avatar_url}
              width={28}
              height={28}
              sizes="28px"
              className="shrink-0 rounded-full object-cover"
              alt=""
            />
          ) : (
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${avatarBg(post.users?.username, post.users?.first_name, post.user_id, post.id)}`}>
              {inicial}
            </span>
          )}
          {nombre && (
            <span className="truncate text-sm text-[#a3a3a3]">{nombre}</span>
          )}
        </Link>

        {post.location && (
          <>
            <span className="text-zinc-600">·</span>
            <span className="flex min-w-0 items-center gap-1 truncate text-xs text-zinc-500">
              <IconMapPin />
              <span className="truncate">{post.location}</span>
            </span>
          </>
        )}
      </div>

      {/* 4. Metadata con íconos */}
      {(modalityLabel || presencialidadLabel || post.category) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          {modalityLabel && (
            <span className="flex items-center gap-1">
              <IconClock />
              {modalityLabel}
            </span>
          )}
          {presencialidadLabel && (
            <span className="flex items-center gap-1">
              <IconGlobe />
              {presencialidadLabel}
            </span>
          )}
          {post.category && (
            <span className="flex items-center gap-1">
              <IconTag />
              {post.category}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
