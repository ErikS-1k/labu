'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// Acciones de la sección Cuenta en /configuracion.
// Cambiar email y contraseña piden la contraseña actual: así nadie con un celular
// desbloqueado puede tomar la cuenta sin saberla.

export type EstadoCuenta = { error: string | null; ok: boolean; mensaje?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN = 6 // mismo mínimo que el registro

// Verifica la contraseña actual re-autenticando contra Supabase
async function passwordCorrecta(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return !error
}

export async function cambiarEmail(_prev: EstadoCuenta, formData: FormData): Promise<EstadoCuenta> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Tu sesión expiró. Volvé a iniciar sesión.', ok: false }

  const nuevo    = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!EMAIL_RE.test(nuevo))   return { error: 'Ingresá un email válido.', ok: false }
  if (nuevo === user.email)    return { error: 'Ese ya es tu email actual.', ok: false }
  if (!password)               return { error: 'Ingresá tu contraseña actual.', ok: false }
  if (!(await passwordCorrecta(user.email, password))) {
    return { error: 'La contraseña actual no es correcta.', ok: false }
  }

  // Supabase no cambia el email hasta que se confirma desde el link que manda por mail
  const { error } = await supabase.auth.updateUser(
    { email: nuevo },
    { emailRedirectTo: `${process.env.SITE_URL}/auth/callback?next=/configuracion` },
  )
  if (error) {
    const yaExiste = error.code === 'email_exists' || /already/i.test(error.message)
    return { error: yaExiste ? 'Ese email ya está en uso por otra cuenta.' : 'No pudimos cambiar el email. Probá de nuevo.', ok: false }
  }

  return {
    error: null,
    ok: true,
    mensaje: `Te mandamos un link a ${nuevo}. El cambio se aplica cuando lo confirmes (revisá también tu email actual).`,
  }
}

export async function cambiarPassword(_prev: EstadoCuenta, formData: FormData): Promise<EstadoCuenta> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Tu sesión expiró. Volvé a iniciar sesión.', ok: false }

  const actual    = String(formData.get('actual') ?? '')
  const nueva     = String(formData.get('nueva') ?? '')
  const confirmar = String(formData.get('confirmar') ?? '')

  if (!actual)                      return { error: 'Ingresá tu contraseña actual.', ok: false }
  if (nueva.length < PASSWORD_MIN)  return { error: `La nueva contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`, ok: false }
  if (nueva !== confirmar)          return { error: 'Las contraseñas nuevas no coinciden.', ok: false }
  if (nueva === actual)             return { error: 'La nueva contraseña tiene que ser distinta de la actual.', ok: false }
  if (!(await passwordCorrecta(user.email, actual))) {
    return { error: 'La contraseña actual no es correcta.', ok: false }
  }

  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) return { error: 'No pudimos cambiar la contraseña. Probá de nuevo.', ok: false }

  return { error: null, ok: true, mensaje: 'Listo, tu contraseña fue actualizada.' }
}

// Elimina la cuenta para siempre. Borrar el usuario de auth.users borra en cascada su fila
// en users y todo lo que cuelga de ella (publicaciones, mensajes, solicitudes, opiniones,
// notificaciones, suscripciones push). Los archivos del storage no se borran en cascada,
// así que se eliminan antes a mano: avatar y, sobre todo, la foto del DNI.
export async function eliminarCuenta(): Promise<EstadoCuenta> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión expiró. Volvé a iniciar sesión.', ok: false }

  const admin = createServiceClient()

  for (const bucket of ['avatars', 'verificaciones']) {
    const { data: archivos, error } = await admin.storage.from(bucket).list(user.id)
    if (error) {
      console.error(`[eliminarCuenta] listar ${bucket}:`, error.message)
      return { error: 'No pudimos eliminar tu cuenta. Probá de nuevo en unos minutos.', ok: false }
    }
    if (archivos && archivos.length > 0) {
      const { error: errRemove } = await admin.storage.from(bucket).remove(archivos.map(a => `${user.id}/${a.name}`))
      if (errRemove) {
        console.error(`[eliminarCuenta] borrar ${bucket}:`, errRemove.message)
        return { error: 'No pudimos eliminar tu cuenta. Probá de nuevo en unos minutos.', ok: false }
      }
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[eliminarCuenta] deleteUser:', error.message)
    return { error: 'No pudimos eliminar tu cuenta. Probá de nuevo en unos minutos.', ok: false }
  }

  // El usuario ya no existe: limpiar las cookies de sesión (puede fallar, no importa)
  await supabase.auth.signOut().catch(() => {})
  redirect('/')
}
