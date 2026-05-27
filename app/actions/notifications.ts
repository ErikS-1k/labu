'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type NotificationType =
  | 'nueva_postulacion'
  | 'postulacion_enviada'
  | 'postulacion_aceptada'
  | 'postulacion_rechazada'
  | 'nuevo_rating'
  | 'nuevo_mensaje'
  | 'trabajo_completado'
  | 'verificacion_aprobada'
  | 'verificacion_rechazada'
  | 'recordatorio_calificacion'

export async function crearNotificacion(params: {
  userId: string
  type: NotificationType
  message: string
  link: string
}): Promise<void> {
  const { error } = await createServiceClient()
    .from('notifications')
    .insert({
      user_id: params.userId,
      type:    params.type,
      message: params.message,
      link:    params.link,
    })

  if (error) {
    console.error('[crearNotificacion]', error.message, params)
  }
}

export async function marcarTodasLeidas() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await createServiceClient()
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)
  revalidatePath('/notificaciones')
}
