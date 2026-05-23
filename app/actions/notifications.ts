'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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

export async function marcarTodasLeidas() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)
  revalidatePath('/notificaciones')
}
