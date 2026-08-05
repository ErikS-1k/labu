'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function solicitarVerificacion(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tenés que estar logueado.', ok: false }

  const userId = formData.get('user_id') as string
  if (userId !== user.id) return { error: 'No autorizado.', ok: false }

  const { data: existente } = await supabase
    .from('verifications')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existente) return { error: 'Ya tenés una solicitud enviada.', ok: false }

  const archivo = formData.get('documento') as File
  if (!archivo || archivo.size === 0) return { error: 'Seleccioná una foto de tu DNI.', ok: false }
  if (archivo.size > 10 * 1024 * 1024) return { error: 'El archivo es muy pesado. El máximo es 10MB.', ok: false }
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
  if (!ALLOWED.includes(archivo.type)) return { error: 'El formato no está soportado. Usá JPG, PNG, HEIC, WEBP o PDF.', ok: false }

  const ext = archivo.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/dni.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('verificaciones')
    .upload(path, archivo, { upsert: true })

  if (uploadError) return { error: 'No se pudo subir el archivo. Intentá de nuevo.', ok: false }

  const { error: insertError } = await supabase.from('verifications').insert({
    user_id: user.id,
    type: 'dni',
    status: 'pendiente',
    document_url: path,
  })

  if (insertError) return { error: 'No se pudo guardar la solicitud. Intentá de nuevo.', ok: false }

  revalidatePath(`/perfil/${user.id}`)
  return { error: null, ok: true }
}
