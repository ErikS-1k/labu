import { Metadata } from 'next'
import { getAuthUser } from '@/lib/auth'
import { cargarNotificaciones } from '@/lib/notificaciones'
import NotificacionesPagina from '@/components/notificaciones/NotificacionesPagina'
import NotificacionesSection from '@/components/pwa/NotificacionesSection'
import PageHeader from '@/components/ui/PageHeader'

export const metadata: Metadata = { title: 'Notificaciones — Labu' }

// Pantalla completa: la usa mobile (campana del header) y es el fallback si se entra por URL.
// En desktop la campana de la barra lateral abre un panel en vez de navegar acá.
export default async function NotificacionesPage() {
  const user  = await getAuthUser()
  const items = await cargarNotificaciones(user!.id)

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader title="Notificaciones" subtitle="Tus novedades recientes" />
      <NotificacionesSection />
      <NotificacionesPagina items={items} userId={user!.id} />
    </main>
  )
}
