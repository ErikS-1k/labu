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
  console.log('=== PUSH FUNCTION CALLED ===', { userId, title: payload.title })
  console.log('[PUSH] VAPID email:', process.env.VAPID_EMAIL ?? 'UNDEFINED')
  console.log('[PUSH] VAPID public key:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'SET' : 'UNDEFINED')
  console.log('[PUSH] VAPID private key:', process.env.VAPID_PRIVATE_KEY ? 'SET' : 'UNDEFINED')
  console.log('[PUSH] SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'UNDEFINED')

  try {
    const service = createServiceClient()
    console.log('[PUSH] Buscando suscripciones para userId:', userId)

    const { data: subs, error: subsError } = await service
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (subsError) {
      console.log('=== PUSH ERROR — query suscripciones ===', subsError.message, subsError.code)
      return
    }

    console.log('[PUSH] Suscripciones encontradas:', subs?.length ?? 0)

    if (!subs?.length) {
      console.log('[PUSH] Sin suscripciones activas para este usuario — saliendo')
      return
    }

    const expiredIds: string[] = []
    await Promise.all(
      subs.map(async (sub) => {
        console.log('[PUSH] Enviando a endpoint:', sub.endpoint.slice(0, 50) + '...')
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ ...payload, icon: payload.icon ?? '/icons/icon-192x192.png' })
          )
          console.log('=== PUSH SENT SUCCESSFULLY ===', sub.endpoint.slice(0, 50) + '...')
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode
          const message = (err as { message?: string }).message
          console.log('=== PUSH ERROR — sendNotification ===', { status, message, endpoint: sub.endpoint.slice(0, 50) })
          if (status === 410 || status === 404) expiredIds.push(sub.id)
        }
      })
    )

    if (expiredIds.length > 0) {
      console.log('[PUSH] Eliminando suscripciones expiradas:', expiredIds.length)
      await service.from('push_subscriptions').delete().in('id', expiredIds)
    }
  } catch (err: unknown) {
    const message = (err as { message?: string }).message
    const stack = (err as { stack?: string }).stack
    console.log('=== PUSH ERROR ===', message, stack)
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
  console.log('[PUSH][server] verificarPushSubscription iniciado')

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('[PUSH][server] verificarPushSubscription — no autenticado:', authError?.message)
    return false
  }

  console.log('[PUSH][server] verificarPushSubscription — userId:', user.id)

  // Usar cliente de sesión del usuario — RLS permite leer sus propias filas
  const { count, error } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (error) {
    console.error('[PUSH][server] verificarPushSubscription — query error:', error.message, error.code)
    return false
  }

  const result = (count ?? 0) > 0
  console.log('[PUSH][server] verificarPushSubscription — count:', count, '/ result:', result)
  return result
}

export async function guardarPushSubscription(sub: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}): Promise<{ error: string | null }> {
  console.log('[PUSH][server] guardarPushSubscription — endpoint:', sub.endpoint.slice(0, 60) + '...')

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('[PUSH][server] No autenticado:', authError?.message)
    return { error: 'No autorizado' }
  }

  console.log('[PUSH][server] userId:', user.id)

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
    console.error('[PUSH][server] upsert falló:', error.message, error.code)
    return { error: error.message }
  }

  console.log('[PUSH][server] suscripción guardada OK para user:', user.id)
  return { error: null }
}
