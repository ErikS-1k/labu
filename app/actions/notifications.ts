'use server'

import { createServiceClient } from '@/lib/supabase/service'

export async function crearNotificacion(params: {
  userId: string
  type: 'nueva_postulacion' | 'postulacion_aceptada' | 'postulacion_rechazada' | 'nuevo_rating'
  message: string
  link: string
}) {
  await createServiceClient().from('notifications').insert({
    user_id: params.userId,
    type:    params.type,
    message: params.message,
    link:    params.link,
  })
}
