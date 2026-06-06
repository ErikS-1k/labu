import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
  const exito       = params.exito === '1'
  const tipoExito   = params.tipo === 'requerimiento' ? 'requerimiento' : 'oferta'

  if (exito) {
    const esOferta = tipoExito === 'oferta'
    return (
      <main className="mx-auto max-w-xl px-4 py-16 flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-900/40 text-3xl">
          ✓
        </div>

        <h1 className="mb-3 text-2xl font-bold text-white">
          {esOferta ? '¡Tu publicación está activa!' : '¡Tu búsqueda está activa!'}
        </h1>

        <p className="mb-8 max-w-sm text-base leading-relaxed text-zinc-400">
          {esOferta
            ? 'Ahora esperá a que alguien se interese y te contacte. Podés revisar y gestionar tus publicaciones desde Mi Actividad.'
            : 'Ahora esperá a que alguien se postule. Podés revisar las postulaciones y gestionar tu búsqueda desde Mi Actividad.'}
        </p>

        <Link
          href="/mi-actividad"
          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
        >
          Ir a Mi Actividad
        </Link>

        <Link
          href="/publicar"
          className="mt-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Publicar otra
        </Link>
      </main>
    )
  }

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
