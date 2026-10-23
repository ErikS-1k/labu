import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import PageHeader from '@/components/ui/PageHeader'
import ConfiguracionView from '@/components/configuracion/ConfiguracionView'

export const metadata: Metadata = { title: 'Configuración — Labu' }

export default async function ConfiguracionPage() {
  // proxy.ts ya protege la ruta; esto es solo para tener el email con tipo seguro
  const user = await getAuthUser()
  if (!user) redirect('/login')

  return (
    <main className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">
      <PageHeader title="Configuración" subtitle="Preferencias de tu cuenta" />
      <ConfiguracionView email={user.email ?? ''} />
    </main>
  )
}
