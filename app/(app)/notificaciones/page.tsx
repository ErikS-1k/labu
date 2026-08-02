import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import NotificacionesList from '@/components/notificaciones/NotificacionesList'

export const metadata: Metadata = { title: 'Notificaciones — Labu' }

export default async function NotificacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
      <NotificacionesList
        initialNotifs={lista}
        userId={user!.id}
        initialUnread={unread}
      />
    </main>
  )
}
