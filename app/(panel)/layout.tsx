import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PanelSidebar from '@/components/layout/PanelSidebar'
import BottomNav from '@/components/layout/BottomNav'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: perfil }, { count }] = await Promise.all([
    supabase.from('users').select('first_name').eq('id', user.id).single(),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false),
  ])

  const userName    = perfil?.first_name ?? null
  const unreadCount = count ?? 0

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <PanelSidebar userId={user.id} userName={userName} unreadCount={unreadCount} />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav userId={user.id} userName={userName} unreadCount={unreadCount} />
    </div>
  )
}
