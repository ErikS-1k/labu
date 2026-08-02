import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'

// El proxy garantiza que el usuario está autenticado antes de llegar acá
export default async function PerfilPage() {
  const user = await getAuthUser()
  redirect(`/perfil/${user!.id}`)
}
