import { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/service'
import { getAuthUser } from '@/lib/auth'
import NotificacionesList from '@/components/notificaciones/NotificacionesList'
import NotificacionesSection from '@/components/pwa/NotificacionesSection'
import PageHeader from '@/components/ui/PageHeader'

export const metadata: Metadata = { title: 'Notificaciones — Labu' }

export default async function NotificacionesPage() {
  const user = await getAuthUser()

  const { data: notifs } = await createServiceClient()
    .from('notifications')
    .select('id, user_id, type, message, link, read, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const lista  = notifs ?? []
  const unread = lista.filter((n: { read: boolean }) => !n.read).length

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader title="Notificaciones" subtitle="Tus novedades recientes" />
      <NotificacionesSection />
      <NotificacionesList
        initialNotifs={lista}
        userId={user!.id}
        initialUnread={unread}
      />
    </main>
  )
}
