import { Metadata } from 'next'
import Link from 'next/link'
import PostForm from '@/components/posts/PostForm'

export const metadata: Metadata = { title: 'Publicar — Labu' }

export default async function PublicarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params      = await searchParams
  const defaultTipo = params.tipo === 'requerimiento' ? 'requerimiento' : 'oferta'
  // ?titulo= viene del CTA "Publicar lo que busco" de /buscar. Se capitaliza la primera letra
  // ("profesora de inglés" → "Profesora de inglés") y se recorta al máximo de 100 caracteres.
  const tituloRaw     = (params.titulo ?? '').trim().slice(0, 100)
  const defaultTitulo = tituloRaw ? tituloRaw[0].toUpperCase() + tituloRaw.slice(1) : ''
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
      <PostForm defaultTipo={defaultTipo} defaultTitulo={defaultTitulo} />
    </main>
  )
}
