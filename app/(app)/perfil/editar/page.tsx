import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import EditarPerfilForm from '@/components/perfil/EditarPerfilForm'
import AgregarSeccionForm from '@/components/perfil/AgregarSeccionForm'
import SeccionCard from '@/components/perfil/SeccionCard'

export const metadata: Metadata = { title: 'Editar perfil — Labu' }

export default async function EditarPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: perfil },
    { data: secciones },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('username, first_name, last_name, headline, bio, location, phone, email, avatar_url')
      .eq('id', user!.id)
      .single(),

    supabase
      .from('profile_sections')
      .select('id, type, title, subtitle, date_from, date_to, url, description')
      .eq('user_id', user!.id)
      .order('type')
      .order('order'),
  ])

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href={`/perfil/${user!.id}`}
        className="mb-6 inline-block text-sm text-zinc-400 hover:text-zinc-600"
      >
        ← Volver al perfil
      </Link>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Editar perfil */}
        <div className="flex-1">
          <h1 className="mb-6 text-xl font-bold text-white">Editar perfil</h1>
          <div className="rounded-xl border border-surface-2 bg-surface-1 p-6">
            <EditarPerfilForm
              userId={user!.id}
              first_name={perfil?.first_name ?? null}
              last_name={perfil?.last_name ?? null}
              username={perfil?.username ?? null}
              headline={perfil?.headline ?? null}
              bio={perfil?.bio ?? null}
              location={perfil?.location ?? null}
              phone={perfil?.phone ?? null}
              email={perfil?.email ?? null}
              avatar_url={perfil?.avatar_url ?? null}
            />
          </div>
        </div>

        {/* Experiencias */}
        <div className="flex-1">
          <h2 className="mb-4 text-xl font-bold text-white">Experiencias</h2>

          {secciones && secciones.length > 0 && (
            <div className="mb-4 flex flex-col gap-2">
              {secciones.map(s => (
                <SeccionCard key={s.id} s={s} />
              ))}
            </div>
          )}

          <AgregarSeccionForm />
        </div>
      </div>
    </main>
  )
}
