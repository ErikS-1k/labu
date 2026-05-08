import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/ofertas')

  return (
    <main>
      {/* Hero */}
      <section className="bg-white px-4 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
            Encontrá trabajo<br />o contratá talento
          </h1>
          <p className="mt-4 text-lg text-zinc-500">
            Oficios, freelance y trabajo profesional. Cualquier rubro, cualquier modalidad, en CABA.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/registro"
              className="w-full rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 sm:w-auto"
            >
              Publicar una oferta
            </Link>
            <Link
              href="/requerimientos"
              className="w-full rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 sm:w-auto"
            >
              Buscar trabajo
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-t border-zinc-100 bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Cómo funciona
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mb-3 text-3xl">📝</div>
              <h3 className="font-semibold text-zinc-900">Publicá</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Ofrecé tus servicios o publicá lo que necesitás. En menos de dos minutos.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 text-3xl">🤝</div>
              <h3 className="font-semibold text-zinc-900">Conectá</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Recibís postulaciones o te postulás directamente. Sin intermediarios.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 text-3xl">⚡</div>
              <h3 className="font-semibold text-zinc-900">Trabajá</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Coordinás por mensaje dentro de la plataforma y arrancás cuando quieras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-zinc-100 bg-white px-4 py-16 text-center">
        <div className="mx-auto max-w-sm">
          <h2 className="text-2xl font-bold text-zinc-900">¿Listo para empezar?</h2>
          <p className="mt-2 text-sm text-zinc-500">Gratis. Sin comisiones en el MVP.</p>
          <Link
            href="/registro"
            className="mt-6 inline-block rounded-xl bg-zinc-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
          >
            Crear cuenta gratis
          </Link>
          <p className="mt-4 text-xs text-zinc-400">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="underline hover:text-zinc-700">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
