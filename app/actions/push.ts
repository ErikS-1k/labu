'use server'

import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function enviarPushNotification(
  userId: string,
  payload: { title: string; body: string; url: string; icon?: string }
): Promise<void> {
  try {
    const service = createServiceClient()
    const { data: subs, error: subsError } = await service
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (subsError) {
      console.error('[push] query suscripciones:', subsError.message, subsError.code)
      return
    }

    if (!subs?.length) return

    const expiredIds: string[] = []
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ ...payload, icon: payload.icon ?? '/icons/icon-192x192.png' })
          )
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode
          if (status === 410 || status === 404) expiredIds.push(sub.id)
          else console.error('[push] sendNotification:', (err as { message?: string }).message)
        }
      })
    )

    if (expiredIds.length > 0) {
      await service.from('push_subscriptions').delete().in('id', expiredIds)
    }
  } catch (err: unknown) {
    console.error('[push] enviarPushNotification:', (err as { message?: string }).message)
  }
}

export async function eliminarPushSubscription(endpoint: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Usar cliente de sesión del usuario — RLS permite operar sobre sus propias filas
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)
}

export async function verificarPushSubscription(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return false

  // Usar cliente de sesión del usuario — RLS permite leer sus propias filas
  const { count, error } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (error) {
    console.error('[push] verificarPushSubscription:', error.message)
    return false
  }

  return (count ?? 0) > 0
}

export async function guardarPushSubscription(sub: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autorizado' }

  // Usar cliente de sesión del usuario — RLS permite insertar/actualizar sus propias filas
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id:  user.id,
        endpoint: sub.endpoint,
        p256dh:   sub.keys.p256dh,
        auth:     sub.keys.auth,
      },
      { onConflict: 'endpoint' }
    )

  if (error) {
    console.error('[push] guardarPushSubscription:', error.message, error.code)
    return { error: error.message }
  }

  return { error: null }
}
