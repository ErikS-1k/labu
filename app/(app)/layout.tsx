import { createClient } from '@/lib/supabase/server'
import PanelSidebar from '@/components/layout/PanelSidebar'
import BottomNav from '@/components/layout/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName: string | null = null
  let unreadCount = 0

  if (user) {
    const [{ data: perfil }, { count }] = await Promise.all([
      supabase.from('users').select('first_name').eq('id', user.id).single(),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false),
    ])
    userName = perfil?.first_name ?? null
    unreadCount = count ?? 0
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-1">
      <PanelSidebar
        userId={user?.id ?? null}
        userName={userName}
        unreadCount={unreadCount}
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
    </div>
  )
}
