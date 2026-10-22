'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { crearNotificacion } from './notifications'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/')
}

export async function aprobarVerificacion(formData: FormData) {
  await checkAdmin()
  const service = createServiceClient()
  const verificationId = formData.get('verification_id') as string
  const userId = formData.get('user_id') as string

  await service.from('verifications')
    .update({ status: 'verificado' })
    .eq('id', verificationId)

  await crearNotificacion({
    userId,
    type:    'verificacion_aprobada',
    message: 'Confirmamos tu identidad. Tu perfil ya muestra «Identidad confirmada».',
    link:    `/perfil/${userId}`,
  })

  revalidatePath('/admin/verificaciones')
  revalidatePath(`/perfil/${userId}`)
}

export async function rechazarVerificacion(formData: FormData) {
  await checkAdmin()
  const service = createServiceClient()
  const verificationId = formData.get('verification_id') as string
  const userId = formData.get('user_id') as string

  await service.from('verifications')
    .update({ status: 'rechazado' })
    .eq('id', verificationId)

  await crearNotificacion({
    userId,
    type:    'verificacion_rechazada',
    message: 'No pudimos confirmar tu identidad con ese documento. Podés subir otro desde «Confirmar identidad».',
    link:    '/verificacion',
  })

  revalidatePath('/admin/verificaciones')
  revalidatePath(`/perfil/${userId}`)
}
