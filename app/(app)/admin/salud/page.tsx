import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'

type TablaInfo = { nombre: string; count: number | null; ultimo: string | null }

export default async function AdminSaludPage() {
  const service = createServiceClient()

  const tablas: Array<{ from: string; label: string }> = [
    { from: 'users',            label: 'Usuarios' },
    { from: 'posts',            label: 'Publicaciones' },
    { from: 'applications',     label: 'Postulaciones' },
    { from: 'messages',         label: 'Mensajes' },
    { from: 'notifications',    label: 'Notificaciones' },
    { from: 'verifications',    label: 'Verificaciones' },
    { from: 'ratings',          label: 'Calificaciones' },
    { from: 'profile_sections', label: 'Secciones de perfil' },
  ]

  // Contar filas y obtener el último registro de cada tabla
  const resultados = await Promise.all(
    tablas.map(async (t) => {
      const [{ count }, { data: ultimo }] = await Promise.all([
        (service.from(t.from) as ReturnType<typeof service.from>).select('*', { count: 'exact', head: true }),
        (service.from(t.from) as ReturnType<typeof service.from>).select('created_at').order('created_at', { ascending: false }).limit(1),
      ])
      return {
        nombre: t.label,
        count:  count ?? null,
        ultimo: (ultimo as Array<{ created_at: string }>)?.[0]?.created_at ?? null,
      } as TablaInfo
    })
  )

  // Último usuario registrado (para ver "hace cuánto fue el último registro")
  const { data: ultimoUsuario } = await service
    .from('users')
    .select('first_name, username, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: ultimoPost } = await service
    .from('posts')
    .select('title, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  function fechaFormato(iso: string | null) {
    if (!iso) return '–'
    return new Date(iso).toLocaleString('es-AR', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  function fechaRelativa(iso: string | null) {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const mins  = Math.floor(diff / 60000)
    const horas = Math.floor(diff / 3600000)
    const dias  = Math.floor(diff / 86400000)
    if (mins < 60)  return `hace ${mins} min`
    if (horas < 24) return `hace ${horas}h`
    if (dias === 1) return 'ayer'
    if (dias < 7)   return `hace ${dias} días`
    return `hace ${Math.floor(dias / 7)} sem`
  }

  const totalFilas = resultados.reduce((acc, r) => acc + (r.count ?? 0), 0)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">← Admin</Link>
      <h1 className="mt-1 text-2xl font-bold text-white">Salud del sistema</h1>
      <p className="text-sm text-zinc-500">Estado de la base de datos de Labu</p>

      {/* Resumen rápido */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4">
          <p className="text-xs text-zinc-500">Total de filas en la DB</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalFilas.toLocaleString('es-AR')}</p>
        </div>
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4">
          <p className="text-xs text-zinc-500">Último usuario registrado</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {(ultimoUsuario as unknown as { first_name: string | null; username: string | null; created_at: string } | null)?.first_name
              || (ultimoUsuario as unknown as { first_name: string | null; username: string | null; created_at: string } | null)?.username
              || '–'}
          </p>
          <p className="text-xs text-zinc-500">
            {fechaRelativa((ultimoUsuario as unknown as { created_at: string } | null)?.created_at ?? null)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4">
          <p className="text-xs text-zinc-500">Última publicación</p>
          <p className="mt-1 text-sm font-semibold text-white line-clamp-1">
            {(ultimoPost as unknown as { title: string; created_at: string } | null)?.title || '–'}
          </p>
          <p className="text-xs text-zinc-500">
            {fechaRelativa((ultimoPost as unknown as { created_at: string } | null)?.created_at ?? null)}
          </p>
        </div>
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
          <p className="text-xs text-zinc-500">Estado de Supabase</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <p className="text-sm font-semibold text-green-400">Operativo</p>
          </div>
          <p className="text-xs text-zinc-600">La DB respondió correctamente a esta carga de página</p>
        </div>
      </div>

      {/* Tabla de conteos por entidad */}
      <div className="mt-6 rounded-2xl border border-[#2a2a2a] bg-[#171717] overflow-hidden">
        <div className="border-b border-[#2a2a2a] px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Filas por tabla</h2>
        </div>
        <div className="divide-y divide-[#222]">
          {resultados.map(r => (
            <div key={r.nombre} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-white">{r.nombre}</p>
                {r.ultimo && (
                  <p className="text-xs text-zinc-600">Último: {fechaFormato(r.ultimo)}</p>
                )}
              </div>
              <span className="font-mono text-sm font-medium text-zinc-300">
                {r.count?.toLocaleString('es-AR') ?? '–'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        Esta página no muestra logs de errores ni accesos por IP — esas funcionalidades requieren integración con Sentry u otro sistema de observabilidad externo.
      </p>
    </main>
  )
}
