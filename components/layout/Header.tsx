import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import HeaderNav from './HeaderNav'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
      <div className="relative mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href={user ? '/ofertas' : '/'} className="text-lg font-bold tracking-tight text-zinc-900">
          Labu
        </Link>
        <HeaderNav isLoggedIn={!!user} userId={user?.id ?? null} />
      </div>
    </header>
  )
}
