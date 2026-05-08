import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Redirige al perfil propio del usuario logueado
export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  redirect(`/perfil/${user.id}`)
}
