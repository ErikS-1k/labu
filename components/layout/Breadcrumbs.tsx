'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Crumb = { label: string; href?: string }

function getCrumbs(pathname: string, userId: string | null): Crumb[] {
  // Páginas raíz: no se muestran breadcrumbs
  if (pathname === '/panel') return []

  // Top-level sin padre — las páginas raíz con PageHeader no muestran breadcrumb
  if (pathname === '/buscar')         return []
  if (pathname === '/publicar')       return []
  if (pathname === '/notificaciones') return []
  if (pathname === '/ofertas')        return [{ label: 'Ofertas' }]
  if (pathname === '/requerimientos') return [{ label: 'Requerimientos' }]

  // Mensajes
  if (pathname === '/mensajes') return []
  if (pathname === '/mensajes/nuevo') return [
    { label: 'Mensajes', href: '/mensajes' },
    { label: 'Nueva conversación' },
  ]
  // /mensajes/[id]: en desktop la lista está al lado y en mobile el chat tapa todo → sin migas
  if (pathname.startsWith('/mensajes/')) return []

  // Mi actividad
  if (pathname === '/mi-actividad') return []
  if (pathname.startsWith('/editar/')) return [
    { label: 'Mi actividad', href: '/mi-actividad' },
    { label: 'Editar publicación' },
  ]

  // Perfil
  if (pathname === '/perfil/editar') return [
    { label: 'Mi perfil', href: userId ? `/perfil/${userId}` : undefined },
    { label: 'Editar perfil' },
  ]
  if (pathname === '/verificacion') return [
    { label: 'Mi perfil', href: userId ? `/perfil/${userId}` : undefined },
    { label: 'Verificación' },
  ]
  if (pathname.startsWith('/perfil/')) {
    const segment = pathname.split('/')[2]
    const isOwn = !!userId && segment === userId
    // Perfil propio → PageHeader en la página, sin breadcrumb
    if (isOwn) return []
    return [{ label: 'Perfil' }]
  }

  // /post/[id] — la página maneja su propio breadcrumb con título real y origen dinámico

  // Admin
  if (pathname === '/admin/verificaciones') return [
    { label: 'Admin' },
    { label: 'Verificaciones' },
  ]

  return []
}

export default function Breadcrumbs({ userId }: { userId: string | null }) {
  const pathname = usePathname()
  const crumbs = getCrumbs(pathname, userId)

  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Ubicación actual" className="flex items-center gap-1.5 px-4 pt-4 text-sm">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-zinc-500 select-none">›</span>}
            {isLast || !crumb.href ? (
              <span className={isLast ? 'font-medium text-white' : 'text-zinc-400'}>
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="text-zinc-400 transition-colors hover:text-white">
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
