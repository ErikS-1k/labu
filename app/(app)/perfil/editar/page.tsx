import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import EditarPerfilForm from '@/components/perfil/EditarPerfilForm'
import AgregarSeccionForm from '@/components/perfil/AgregarSeccionForm'
import { eliminarSeccion } from '@/app/actions/perfil'

export const metadata: Metadata = { title: 'Editar perfil — Labu' }

const TIPO_LABEL: Record<string, string> = {
  experiencia: 'Experiencia',
  educacion:   'Educación',
  certificado: 'Certificado',
  proyecto:    'Proyecto',
  curso:       'Curso',
}

export default async function EditarPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: perfil },
    { data: secciones },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('username, first_name, last_name, headline, bio, location, phone, avatar_url')
      .eq('id', user.id)
      .single(),

    supabase
      .from('profile_sections')
      .select('id, type, title, subtitle, date_from, date_to, url, description')
      .eq('user_id', user.id)
      .order('type')
      .order('order'),
  ])

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href={`/perfil/${user.id}`}
        className="mb-6 inline-block text-sm text-zinc-400 hover:text-zinc-600"
      >
        ← Volver al perfil
      </Link>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Editar perfil */}
        <div className="flex-1">
          <h1 className="mb-6 text-xl font-bold text-foreground">Editar perfil</h1>
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <EditarPerfilForm
              first_name={perfil?.first_name ?? null}
              last_name={perfil?.last_name ?? null}
              username={perfil?.username ?? null}
              headline={perfil?.headline ?? null}
              bio={perfil?.bio ?? null}
              location={perfil?.location ?? null}
              phone={perfil?.phone ?? null}
              avatar_url={perfil?.avatar_url ?? null}
            />
          </div>
        </div>

        {/* Información complementaria */}
        <div className="flex-1">
          <h2 className="mb-4 text-xl font-bold text-foreground">Información Complementaria</h2>

          {secciones && secciones.length > 0 && (
            <div className="mb-4 flex flex-col gap-2">
              {secciones.map(s => (
                <div key={s.id} className="flex items-start justify-between gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      {TIPO_LABEL[s.type] ?? s.type}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium text-zinc-900">{s.title}</p>
                    {s.subtitle && (
                      <p className="text-xs text-zinc-500">{s.subtitle}</p>
                    )}
                    {(s.date_from || s.date_to) && (
                      <p className="text-xs text-zinc-400">
                        {[s.date_from, s.date_to].filter(Boolean).join(' – ')}
                      </p>
                    )}
                  </div>
                  <form action={eliminarSeccion.bind(null, s.id)}>
                    <button
                      type="submit"
                      className="shrink-0 text-xs text-red-400 hover:text-red-600"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          <AgregarSeccionForm />
        </div>
      </div>
    </main>
  )
}
