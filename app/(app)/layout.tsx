import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import PanelSidebar from '@/components/layout/PanelSidebar'
import BottomNav from '@/components/layout/BottomNav'
import FloatingPublishMenu from '@/components/layout/FloatingPublishMenu'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName: string | null = null
  let unreadCount = 0
  let unreadNotifCount = 0

  if (user) {
    const [{ data: perfil }, { count: msgCount }, { count: notifCount }] = await Promise.all([
      supabase.from('users').select('first_name').eq('id', user.id).single(),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false),
      createServiceClient().from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
    ])
    userName = perfil?.first_name ?? null
    unreadCount = msgCount ?? 0
    unreadNotifCount = notifCount ?? 0
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-1">
      <PanelSidebar
        userId={user?.id ?? null}
        userName={userName}
        unreadCount={unreadCount}
        unreadNotifCount={unreadNotifCount}
        isLoggedIn={!!user}
      />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav
        userId={user?.id ?? null}
        userName={userName}
        unreadCount={unreadCount}
        isLoggedIn={!!user}
      />

      <FloatingPublishMenu isLoggedIn={!!user} />
    </div>
  )
}
