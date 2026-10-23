import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas que requieren sesión activa (sin condiciones adicionales)
const RUTAS_PROTEGIDAS = [
  '/perfil/editar',
  '/mi-actividad',
  '/publicar',
  '/verificacion',
  '/mensajes',
  '/notificaciones',
  '/editar',
  '/configuracion',
  '/reportar-problema',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // URL legacy → redirigir sin chequear auth
  if (pathname === '/mis-publicaciones') {
    return NextResponse.redirect(new URL('/mi-actividad', request.url))
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() también refresca el token si expiró — no reemplazar con getSession()
  const { data: { user } } = await supabase.auth.getUser()

  // /perfil sin ID → redirigir al perfil propio
  if (pathname === '/perfil') {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    return NextResponse.redirect(new URL(`/perfil/${user.id}`, request.url))
  }

  // Rutas de admin: solo ADMIN_EMAIL; cualquier otro (logueado o no) va a /
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return supabaseResponse
  }

  // Rutas protegidas generales: requieren estar logueado
  const esProtegida = RUTAS_PROTEGIDAS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  if (esProtegida && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Aplica el proxy a todas las rutas excepto archivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
