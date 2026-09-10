import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { aprobarVerificacion, rechazarVerificacion } from '@/app/actions/admin'

export default async function AdminVerificacionesPage() {
  const service = createServiceClient()

  const { data: solicitudes, error: queryError } = await service
    .from('verifications')
    .select('id, user_id, document_url, created_at, users(username, first_name, last_name)')
    .eq('status', 'pendiente')
    .order('created_at', { ascending: true })

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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">← Admin</Link>
      <h1 className="mt-1 text-2xl font-bold text-white">Verificaciones pendientes</h1>
      <p className="text-sm text-zinc-500">
        {conUrls.length === 0 ? 'Todo al día' : `${conUrls.length} solicitud${conUrls.length !== 1 ? 'es' : ''} pendiente${conUrls.length !== 1 ? 's' : ''}`}
      </p>

      {queryError && (
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Error al cargar: {queryError.message}
        </p>
      )}

      {conUrls.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">✅</span>
          <p className="text-sm text-zinc-400">No hay solicitudes pendientes.</p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {conUrls.map((s) => {
            const usuario = s.users as unknown as { username: string | null; first_name: string | null; last_name: string | null } | null
            const nombre  = [usuario?.first_name, usuario?.last_name].filter(Boolean).join(' ') || usuario?.username || 'Usuario'
            const fechaStr = new Date(s.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

            return (
              <div key={s.id} className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400">Pendiente</span>
                    </div>
                    <Link href={`/perfil/${s.user_id}`} className="mt-2 block font-semibold text-white hover:underline">{nombre}</Link>
                    <p className="text-xs text-zinc-500">{fechaStr}</p>
                    {s.signedUrl ? (
                      <a
                        href={s.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm text-blue-400 hover:underline"
                      >
                        Ver documento →
                      </a>
                    ) : (
                      <p className="mt-2 text-xs italic text-zinc-500">Sin documento adjunto</p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <form action={aprobarVerificacion}>
                      <input type="hidden" name="verification_id" value={s.id} />
                      <input type="hidden" name="user_id" value={s.user_id} />
                      <button type="submit" className="w-full rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700">
                        Aprobar
                      </button>
                    </form>
                    <form action={rechazarVerificacion}>
                      <input type="hidden" name="verification_id" value={s.id} />
                      <input type="hidden" name="user_id" value={s.user_id} />
                      <button type="submit" className="w-full rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10">
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
