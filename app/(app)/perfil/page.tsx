import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// El proxy garantiza que el usuario está autenticado antes de llegar acá
export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  redirect(`/perfil/${user!.id}`)
}
