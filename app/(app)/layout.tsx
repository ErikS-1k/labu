import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import PanelSidebar from '@/components/layout/PanelSidebar'
import BottomNav from '@/components/layout/BottomNav'
import FloatingPublishMenu from '@/components/layout/FloatingPublishMenu'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import Toaster from '@/components/ui/Toaster'

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
    <div className="flex h-dvh overflow-hidden bg-surface-1">
      <Suspense fallback={<div className="hidden md:flex h-dvh w-14 shrink-0 border-r border-surface-2 bg-surface-0" />}>
        <PanelSidebar
          userId={user?.id ?? null}
          userName={userName}
          unreadCount={unreadCount}
          unreadNotifCount={unreadNotifCount}
          isLoggedIn={!!user}
        />
      </Suspense>
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Suspense fallback={null}>
          <Breadcrumbs userId={user?.id ?? null} />
        </Suspense>
        {children}
      </main>
      <Suspense fallback={null}>
        <BottomNav
          userId={user?.id ?? null}
          userName={userName}
          unreadCount={unreadCount}
          isLoggedIn={!!user}
        />
      </Suspense>

      <FloatingPublishMenu isLoggedIn={!!user} />
      <Suspense><Toaster /></Suspense>
    </div>
  )
}
