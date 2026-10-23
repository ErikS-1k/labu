import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Destino opcional (ej. confirmar cambio de email → /configuracion). Solo rutas internas:
  // "/algo" sí, "//otro-sitio.com" o "https://..." no (evita redirecciones a sitios externos).
  const next = searchParams.get('next')
  const destino = next && next.startsWith('/') && !next.startsWith('//') ? next : null

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(destino
        ? `${origin}${destino}${destino.includes('?') ? '&' : '?'}toast=email_actualizado`
        : `${origin}/panel?toast=bienvenido`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmacion`)
}
