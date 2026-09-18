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
  const service = createServiceClient()
  const { data: subs } = await service
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

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
        else console.error('[enviarPushNotification]', err)
      }
    })
  )

  if (expiredIds.length > 0) {
    await service.from('push_subscriptions').delete().in('id', expiredIds)
  }
}

export async function eliminarPushSubscription(endpoint: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await createServiceClient()
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)
}

export async function guardarPushSubscription(sub: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await createServiceClient()
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
    console.error('[guardarPushSubscription]', error.message)
    return { error: error.message }
  }
  return { error: null }
}
