import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAuthUser } from '@/lib/auth'
import PanelSidebar from '@/components/layout/PanelSidebar'
import BottomNav from '@/components/layout/BottomNav'
import MobileHeader from '@/components/layout/MobileHeader'
import FloatingPublishMenu from '@/components/layout/FloatingPublishMenu'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import Toaster from '@/components/ui/Toaster'
import { UnreadMessagesProvider } from '@/components/mensajes/UnreadMessagesProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const user = await getAuthUser()

  let userName: string | null = null
  let userUsername: string | null = null
  let userAvatarUrl: string | null = null
  let unreadCount = 0
  let unreadNotifCount = 0
  let unreadActividadCount = 0

  if (user) {
    const [{ data: perfil }, { count: msgCount }, { count: notifCount }, { count: actividadCount }] = await Promise.all([
      supabase.from('users').select('username, first_name, avatar_url').eq('id', user.id).single(),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false),
      createServiceClient().from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
      createServiceClient().from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false).in('type', ['nueva_postulacion', 'postulacion_aceptada', 'postulacion_rechazada', 'trabajo_completado', 'recordatorio_calificacion']),
    ])
    userName = perfil?.first_name ?? null
    userUsername = perfil?.username ?? null
    userAvatarUrl = perfil?.avatar_url ?? null
    unreadCount = msgCount ?? 0
    unreadNotifCount = notifCount ?? 0
    unreadActividadCount = actividadCount ?? 0
  }

  return (
    // Un solo canal Realtime de mensajes para nav, banner de /panel y toast de mensaje nuevo
    <UnreadMessagesProvider userId={user?.id ?? null} initialCount={unreadCount}>
    <div className="flex h-dvh overflow-hidden bg-surface-0">
      <Suspense fallback={<div className="hidden md:flex h-dvh w-14 shrink-0 border-r border-surface-2 bg-surface-0" />}>
        <PanelSidebar
          userId={user?.id ?? null}
          userName={userName}
          unreadNotifCount={unreadNotifCount}
          unreadActividadCount={unreadActividadCount}
          isLoggedIn={!!user}
        />
      </Suspense>
      <main className="flex-1 overflow-y-auto pb-36 md:pb-0">
        <Suspense fallback={null}>
          <MobileHeader
            userId={user?.id ?? null}
            userName={userName}
            userUsername={userUsername}
            userAvatarUrl={userAvatarUrl}
            initialCount={unreadNotifCount}
          />
        </Suspense>
        <Suspense fallback={null}>
          <Breadcrumbs userId={user?.id ?? null} />
        </Suspense>
        {children}
      </main>
      <Suspense fallback={null}>
        <BottomNav
          userId={user?.id ?? null}
          unreadActividadCount={unreadActividadCount}
          isLoggedIn={!!user}
        />
      </Suspense>

      <FloatingPublishMenu isLoggedIn={!!user} />
      <Suspense><Toaster /></Suspense>
    </div>
    </UnreadMessagesProvider>
  )
}
