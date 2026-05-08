'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function actualizarPerfil(
  _prevState: { error: string | null },
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const first_name = (formData.get('first_name') as string).trim() || null
  const last_name  = (formData.get('last_name')  as string).trim() || null
  const username   = (formData.get('username')   as string).trim().toLowerCase() || null
  const headline   = (formData.get('headline')   as string).trim() || null
  const bio        = (formData.get('bio')        as string).trim() || null
  const location   = (formData.get('location')   as string).trim() || null
  const phone      = (formData.get('phone')      as string).trim() || null

  if (!first_name) return { error: 'El nombre es obligatorio.' }

  if (username && !/^[a-z0-9_]{3,30}$/.test(username)) {
    return { error: 'El username solo puede tener letras, números y _ (3 a 30 caracteres).' }
  }

  if (username) {
    const { data: existente } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .maybeSingle()

    if (existente) return { error: 'Ese username ya está en uso.' }
  }

  const { error } = await supabase.from('users')
    .update({ first_name, last_name, username, headline, bio, location, phone })
    .eq('id', user.id)

  if (error) return { error: 'No se pudo guardar. Intentá de nuevo.' }

  revalidatePath(`/perfil/${user.id}`)
  redirect(`/perfil/${user.id}`)
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

export async function eliminarSeccion(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('profile_sections').delete().eq('id', id).eq('user_id', user.id)

  revalidatePath(`/perfil/editar`)
  revalidatePath(`/perfil/${user.id}`)
}
