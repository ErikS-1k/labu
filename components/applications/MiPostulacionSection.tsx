'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { iniciarConversacion } from '@/app/actions/mensajes'

type Status = 'pendiente' | 'aceptado' | 'rechazado'

type Props = {
  initialStatus: Status
  applicationId: string
  postId: string
  postUserId: string
  postType: 'oferta' | 'requerimiento'
}

export default function MiPostulacionSection({ initialStatus, applicationId, postId, postUserId }: Props) {
  const [status, setStatus] = useState<Status>(initialStatus)

  // Sincronizar si el servidor re-renderiza con nuevo estado
  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus])

  // Realtime: detectar cuando el autor acepta o rechaza
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | undefined
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)

      channel = supabase
        .channel(`mi-app-${applicationId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
        }, (payload) => {
          const updated = payload.new as { id: string; status: Status }
          if (updated.id === applicationId) setStatus(updated.status)
        })
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [applicationId])

  if (status === 'aceptado') {
    return (
      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="mb-3 text-sm font-semibold text-green-800">
          ✓ ¡Quieren trabajar con vos!
        </p>
        <form action={iniciarConversacion} className="mt-4">
          <input type="hidden" name="post_id"     value={postId} />
          <input type="hidden" name="receiver_id" value={postUserId} />
          <button
            type="submit"
            className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-800"
          >
            Abrir conversación
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
      status === 'rechazado'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-surface-2 bg-surface-2 text-zinc-400'
    }`}>
      {status === 'pendiente' && 'Solicitud enviada · Esperando respuesta.'}
      {status === 'rechazado' && 'Esta vez eligieron a otra persona.'}
    </div>
  )
}
