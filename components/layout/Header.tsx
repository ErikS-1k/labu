import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import HeaderNav from './HeaderNav'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName: string | null = null
  if (user) {
    const { data: perfil } = await supabase
      .from('users')
      .select('first_name')
      .eq('id', user.id)
      .single()
    userName = perfil?.first_name ?? null
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
      <div className="relative mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <HeaderNav isLoggedIn={!!user} userId={user?.id ?? null} userName={userName} />
        <Link href={user ? '/panel' : '/'} className="text-lg font-bold tracking-tight text-zinc-900">
          Labu
        </Link>
      </div>
    </header>
  )
}
