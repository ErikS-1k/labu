import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import EditarPerfilForm from '@/components/perfil/EditarPerfilForm'
import AgregarSeccionForm from '@/components/perfil/AgregarSeccionForm'
import SeccionCard from '@/components/perfil/SeccionCard'

export const metadata: Metadata = { title: 'Editar perfil — Labu' }

function IconUser() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function IconBriefcase() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  )
}

export default async function EditarPerfilPage() {
  const supabase = await createClient()
  const user = await getAuthUser()

  const [{ data: perfil }, { data: secciones }] = await Promise.all([
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
    <main className="mx-auto max-w-2xl px-4 pb-14 pt-8">

      {/* ── Hero ── */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20">
          <IconUser />
        </div>
        <h1 className="font-serif text-3xl font-medium text-white">Editá tu perfil</h1>
        <p className="mx-auto mt-3 max-w-sm text-zinc-400">
          Cuanto más completo esté tu perfil, más confianza generás en otros usuarios.
        </p>
      </div>

      {/* ── Formulario de perfil ── */}
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

      {/* ── Experiencias (sección independiente debajo del form) ── */}
      <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
            <IconBriefcase />
          </div>
          <h2 className="text-sm font-semibold text-white">Experiencias</h2>
        </div>

        {secciones && secciones.length > 0 && (
          <div className="flex flex-col gap-2">
            {secciones.map(s => <SeccionCard key={s.id} s={s} />)}
          </div>
        )}

        <AgregarSeccionForm />
      </div>

    </main>
  )
}
