'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type PerfilState = { error: string | null; toast: string | null }

export async function actualizarPerfil(
  _prevState: PerfilState,
  formData: FormData
): Promise<PerfilState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.', toast: null }

  const first_name = (formData.get('first_name') as string).trim() || null
  const last_name  = (formData.get('last_name')  as string).trim() || null
  const username   = (formData.get('username')   as string).trim().toLowerCase() || null
  const headline   = (formData.get('headline')   as string).trim() || null
  const bio        = (formData.get('bio')        as string).trim() || null
  const location   = (formData.get('location')   as string).trim() || null
  const phone      = (formData.get('phone')      as string).trim() || null
  const email      = (formData.get('email')      as string).trim() || null

  if (!first_name) return { error: 'El nombre es obligatorio.', toast: null }

  if (username && !/^[a-z0-9_]{3,30}$/.test(username)) {
    return { error: 'El username solo puede tener letras, números y _ (3 a 30 caracteres).', toast: null }
  }

  if (username) {
    const { data: existente } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .maybeSingle()

    if (existente) return { error: 'Ese username ya está en uso.', toast: null }
  }

  // Avatar upload (opcional)
  let avatar_url: string | undefined
  const avatarFile = formData.get('avatar') as File
  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > 10 * 1024 * 1024) return { error: 'La foto es muy pesada. El máximo es 10MB.', toast: null }
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    if (!ALLOWED.includes(avatarFile.type)) return { error: 'El formato no está soportado. Usá JPG, PNG, HEIC o WEBP.', toast: null }
    const ext = avatarFile.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, avatarFile, { upsert: true })
    if (uploadError) return { error: 'No se pudo subir la foto. Intentá de nuevo.', toast: null }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    avatar_url = urlData.publicUrl
  }

  const updates: Record<string, unknown> = { first_name, last_name, username, headline, bio, location, phone, email }
  if (avatar_url) updates.avatar_url = avatar_url

  const { error } = await supabase.from('users').update(updates).eq('id', user.id)

  if (error) return { error: 'No se pudo guardar. Intentá de nuevo.', toast: null }

  revalidatePath(`/perfil/${user.id}`)
  revalidatePath('/perfil/editar')
  return { error: null, toast: 'perfil_actualizado' }
}

const TIPOS_VALIDOS = ['experiencia', 'educacion', 'certificado', 'proyecto', 'curso']

export async function agregarSeccion(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.', ok: false }

  const type        = (formData.get('type')        as string ?? '').trim()
  const title       = (formData.get('title')       as string ?? '').trim()
  const subtitle    = (formData.get('subtitle')    as string ?? '').trim() || null
  const description = (formData.get('description') as string ?? '').trim() || null
  const date_from   = (formData.get('date_from')   as string ?? '').trim() || null
  const date_to     = (formData.get('date_to')     as string ?? '').trim() || null
  const url         = (formData.get('url')         as string ?? '').trim() || null

  if (!TIPOS_VALIDOS.includes(type)) return { error: 'Tipo inválido.', ok: false }
  if (!title) return { error: 'El título es obligatorio.', ok: false }

  const { error } = await supabase.from('profile_sections').insert({
    user_id: user.id, type, title, subtitle, description, date_from, date_to, url,
  })

  if (error) return { error: 'No se pudo guardar. Intentá de nuevo.', ok: false }

  revalidatePath(`/perfil/editar`)
  revalidatePath(`/perfil/${user.id}`)
  return { error: null, ok: true }
}

export async function editarSeccion(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.', ok: false }

  const id          = (formData.get('section_id')  as string ?? '').trim()
  const type        = (formData.get('type')        as string ?? '').trim()
  const title       = (formData.get('title')       as string ?? '').trim()
  const subtitle    = (formData.get('subtitle')    as string ?? '').trim() || null
  const description = (formData.get('description') as string ?? '').trim() || null
  const date_from   = (formData.get('date_from')   as string ?? '').trim() || null
  const date_to     = (formData.get('date_to')     as string ?? '').trim() || null
  const url         = (formData.get('url')         as string ?? '').trim() || null

  if (!TIPOS_VALIDOS.includes(type)) return { error: 'Tipo inválido.', ok: false }
  if (!title) return { error: 'El título es obligatorio.', ok: false }

  const { error } = await supabase
    .from('profile_sections')
    .update({ type, title, subtitle, description, date_from, date_to, url })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'No se pudo guardar. Intentá de nuevo.', ok: false }

  revalidatePath('/perfil/editar')
  revalidatePath(`/perfil/${user.id}`)
  return { error: null, ok: true }
}

export async function eliminarSeccion(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('profile_sections').delete().eq('id', id).eq('user_id', user.id)

  revalidatePath(`/perfil/editar`)
  revalidatePath(`/perfil/${user.id}`)
}

export async function eliminarFoto(): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  // Listar y eliminar todos los archivos del usuario en el bucket
  const { data: files } = await supabase.storage.from('avatars').list(user.id)
  if (files && files.length > 0) {
    const paths = files.map(f => `${user.id}/${f.name}`)
    await supabase.storage.from('avatars').remove(paths)
  }

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: null })
    .eq('id', user.id)

  if (error) return { error: 'No se pudo eliminar la foto. Intentá de nuevo.' }

  revalidatePath('/perfil/editar')
  revalidatePath(`/perfil/${user.id}`)
  return { error: null }
}

export async function completarOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('users').update({ first_login: false }).eq('id', user.id)
  revalidatePath('/panel')
}

export async function completarOnboardingNotificaciones() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('users').update({ onboarding_notifications_done: true }).eq('id', user.id)
  revalidatePath('/panel')
}
