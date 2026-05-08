import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { aprobarVerificacion, rechazarVerificacion } from '@/app/actions/admin'

export default async function AdminVerificacionesPage() {
  // Verificar que sea el admin con el cliente normal (tiene la sesión del usuario)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/')

  // Usar el service client para leer sin restricciones de RLS
  const service = createServiceClient()

  const { data: solicitudes, error: queryError } = await service
    .from('verifications')
    .select('id, user_id, document_url, created_at, users(username, first_name, last_name)')
    .eq('status', 'pendiente')
    .order('created_at', { ascending: true })


  // Generar URLs firmadas (válidas 5 minutos) para poder ver los documentos
  const conUrls = await Promise.all(
    (solicitudes ?? []).map(async (s) => {
      if (!s.document_url) return { ...s, signedUrl: null }
      const { data } = await service.storage
        .from('verificaciones')
        .createSignedUrl(s.document_url, 300)
      return { ...s, signedUrl: data?.signedUrl ?? null }
    })
  )

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-zinc-900">Verificaciones pendientes</h1>
      <p className="mb-6 text-sm text-zinc-500">
        {conUrls.length === 0 ? 'No hay solicitudes' : `${conUrls.length} solicitud${conUrls.length !== 1 ? 'es' : ''}`}
      </p>

      {queryError && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Error al cargar: {queryError.message}
        </p>
      )}

      {conUrls.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-400">Todo al día.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {conUrls.map((s) => {
            const usuario = s.users as unknown as { username: string | null; first_name: string | null; last_name: string | null } | null
            const nombre = [usuario?.first_name, usuario?.last_name].filter(Boolean).join(' ') || usuario?.username || 'Usuario'
            return (
              <div key={s.id} className="rounded-xl border border-zinc-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900">{nombre}</p>
                    <p className="text-sm text-zinc-400">
                      {new Date(s.created_at).toLocaleDateString('es-AR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    {s.signedUrl ? (
                      <a
                        href={s.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm text-blue-600 underline hover:text-blue-800"
                      >
                        Ver documento →
                      </a>
                    ) : (
                      <p className="mt-2 text-sm text-zinc-400 italic">Sin documento adjunto</p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <form action={aprobarVerificacion}>
                      <input type="hidden" name="verification_id" value={s.id} />
                      <input type="hidden" name="user_id" value={s.user_id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                      >
                        Aprobar
                      </button>
                    </form>
                    <form action={rechazarVerificacion}>
                      <input type="hidden" name="verification_id" value={s.id} />
                      <input type="hidden" name="user_id" value={s.user_id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        Rechazar
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
