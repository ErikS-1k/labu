'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { aceptarPostulacion, rechazarPostulacion } from '@/app/actions/applications'
import { iniciarConversacion } from '@/app/actions/mensajes'

type UserInfo = {
  first_name: string | null
  last_name: string | null
  username: string | null
  email: string | null
  phone: string | null
  rating_avg: number | null
  rating_count: number | null
}

export type Aplicacion = {
  id: string
  status: 'pendiente' | 'aceptado' | 'rechazado'
  message: string | null
  created_at: string
  applicant_id: string
  confirmed_by_client: boolean | null
  confirmed_by_worker: boolean | null
  completed_at: string | null
  users: UserInfo | null
}

type Props = {
  initialPostulaciones: Aplicacion[]
  postId: string
  postType: 'oferta' | 'requerimiento'
}

export default function PostulacionesAutorSection({ initialPostulaciones, postId, postType }: Props) {
  const [postulaciones, setPostulaciones] = useState<Aplicacion[]>(initialPostulaciones)
  const esRequerimiento = postType === 'requerimiento'

  // Sincronizar cuando el servidor revalida (ej: después de aceptar/rechazar)
  useEffect(() => {
    setPostulaciones(initialPostulaciones)
  }, [initialPostulaciones])

  // Realtime: nuevas postulaciones mientras la página está abierta
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | undefined
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)

      channel = supabase
        .channel(`autor-apps-${postId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'applications',
        }, async (payload) => {
          const nueva = payload.new as { post_id: string; id: string }
          if (nueva.post_id !== postId) return

          // Fetchear con datos del usuario (el payload de Realtime no incluye el JOIN)
          const { data } = await supabase
            .from('applications')
            .select('id, status, message, created_at, applicant_id, confirmed_by_client, confirmed_by_worker, completed_at, users(first_name, last_name, username, email, phone, rating_avg, rating_count)')
            .eq('id', nueva.id)
            .single()

          if (data) {
            setPostulaciones(prev =>
              prev.find(p => p.id === data.id) ? prev : [...prev, data as unknown as Aplicacion]
            )
          }
        })
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [postId])

  return (
    // id="solicitudes": destino del indicador "N solicitudes pendientes" de Mi actividad
    <div id="solicitudes" className="mt-4 scroll-mt-24 rounded-xl border border-surface-2 bg-surface-1 p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {esRequerimiento ? 'Solicitudes' : 'Solicitudes de contacto'} ({postulaciones.length})
      </p>
      {postulaciones.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Todavía nadie te contactó.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {postulaciones.map(p => {
            const ap = p.users
            const nombre = [ap?.first_name, ap?.last_name].filter(Boolean).join(' ') || ap?.username || 'Usuario'
            return (
              <div key={p.id} className={`rounded-lg border p-4 ${
                p.status === 'aceptado'  ? 'border-green-200 bg-green-50' :
                p.status === 'rechazado' ? 'border-surface-2 bg-surface-1 opacity-60' :
                'border-surface-2'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/perfil/${p.applicant_id}`} target="_blank" className="font-medium text-white hover:underline">
                      {nombre}
                    </Link>
                    {(ap?.rating_count ?? 0) > 0 && (
                      <p className="text-xs text-zinc-400">★ {ap?.rating_avg} · {ap?.rating_count} calificaciones</p>
                    )}
                    {p.message && (
                      <p className="mt-2 text-sm text-zinc-600">{p.message}</p>
                    )}
                  </div>

                  {p.status === 'pendiente' && (
                    <div className="flex shrink-0 gap-2">
                      <form action={aceptarPostulacion}>
                        <input type="hidden" name="application_id" value={p.id} />
                        <input type="hidden" name="post_id"        value={postId} />
                        <button type="submit" className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
                          Aceptar
                        </button>
                      </form>
                      <form action={rechazarPostulacion}>
                        <input type="hidden" name="application_id" value={p.id} />
                        <input type="hidden" name="post_id"        value={postId} />
                        <button type="submit" className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                          Rechazar
                        </button>
                      </form>
                    </div>
                  )}
                  {p.status !== 'pendiente' && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === 'aceptado' ? 'bg-green-900/40 text-green-400' : 'bg-surface-2 text-zinc-400'
                    }`}>
                      {p.status === 'aceptado' ? 'Aceptado' : 'Rechazado'}
                    </span>
                  )}
                </div>

                {p.status === 'aceptado' && (
                  <form action={iniciarConversacion} className="mt-3">
                    <input type="hidden" name="post_id"     value={postId} />
                    <input type="hidden" name="receiver_id" value={p.applicant_id} />
                    <button type="submit" className="w-full rounded-lg bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-blue-600">
                      Iniciar conversación
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
