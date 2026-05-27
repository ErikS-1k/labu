import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PublicarForm from '@/components/posts/PublicarForm'

export const metadata: Metadata = { title: 'Publicar — Labu' }

export default async function PublicarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const params      = await searchParams
  const defaultTipo = params.tipo === 'requerimiento' ? 'requerimiento' : 'oferta'

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-white">Nueva publicación</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Completá los campos. Solo el título y la modalidad son obligatorios.
      </p>
      <PublicarForm defaultTipo={defaultTipo} />
    </main>
  )
}
