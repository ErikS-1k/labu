'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DESCRIPCION_MAX, DESCRIPCION_MIN, ESTADOS_REPORTE, TIPOS_REPORTE } from '@/lib/reportes'

export type EstadoReporte = { error: string | null }

export async function crearReporte(_prev: EstadoReporte, formData: FormData): Promise<EstadoReporte> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión expiró. Volvé a iniciar sesión.' }

  const tipo        = String(formData.get('tipo') ?? '')
  const descripcion = String(formData.get('descripcion') ?? '').trim()

  if (!TIPOS_REPORTE.some(t => t.value === tipo)) return { error: 'Elegí el tipo de reporte.' }
  if (descripcion.length < DESCRIPCION_MIN) return { error: `Contanos un poco más (mínimo ${DESCRIPCION_MIN} caracteres).` }
  if (descripcion.length > DESCRIPCION_MAX) return { error: `La descripción puede tener hasta ${DESCRIPCION_MAX} caracteres.` }

  const { error } = await supabase.from('reportes').insert({ user_id: user.id, type: tipo, description: descripcion })
  if (error) {
    console.error('[crearReporte]', error.message)
    return { error: 'No pudimos enviar el reporte. Probá de nuevo en unos minutos.' }
  }

  revalidatePath('/admin/reportes')
  revalidatePath('/admin')
  redirect('/panel?toast=reporte_enviado')
}

// Solo admin: cambia el estado de un reporte (service role, igual que el resto de /admin)
export async function cambiarEstadoReporte(id: string, estado: string): Promise<EstadoReporte> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) return { error: 'No autorizado.' }
  if (!ESTADOS_REPORTE.some(e => e.value === estado)) return { error: 'Estado inválido.' }

  const { error } = await createServiceClient().from('reportes').update({ status: estado }).eq('id', id)
  if (error) return { error: 'No se pudo actualizar.' }

  revalidatePath('/admin/reportes')
  revalidatePath('/admin')
  return { error: null }
}
