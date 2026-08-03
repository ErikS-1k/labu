import { Metadata } from 'next'
import Link from 'next/link'
import PublicarForm from '@/components/posts/PublicarForm'

export const metadata: Metadata = { title: 'Publicar — Labu' }

function IconMegaphone() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3z"/>
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
    </svg>
  )
}

export default async function PublicarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params      = await searchParams
  const defaultTipo = params.tipo === 'requerimiento' ? 'requerimiento' : 'oferta'
  const exito       = params.exito === '1'
  const tipoExito   = params.tipo === 'requerimiento' ? 'requerimiento' : 'oferta'

  if (exito) {
    const esOferta = tipoExito === 'oferta'
    return (
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
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
          className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
        >
          Ir a Mi Actividad
        </Link>

        <Link
          href="/publicar"
          className="mt-4 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          Publicar otra
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-xl px-4 pb-12 pt-8">
      {/* Hero — visible en todos los viewports (MobileHeader no cubre /publicar) */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20">
          <IconMegaphone />
        </div>
        <h1 className="text-3xl font-bold text-white">Publicá tu servicio o búsqueda</h1>
        <p className="mx-auto mt-3 max-w-sm text-zinc-400">
          Es gratis y tarda menos de un minuto. Empezá a conectar hoy mismo.
        </p>
      </div>

      <PublicarForm defaultTipo={defaultTipo} />
    </main>
  )
}
