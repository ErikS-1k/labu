import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'

function hace7dias() {
  const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString()
}

function formatDia(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })
}

function StatCard({ titulo, valor, sub, color = 'text-white' }: {
  titulo: string; valor: string | number; sub?: string; color?: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">
      <p className="text-xs text-zinc-500">{titulo}</p>
      <p className={`text-3xl font-bold tabular-nums ${color}`}>{valor}</p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

export default async function AdminMetricasPage() {
  const service = createServiceClient()
  const hace7d  = hace7dias()

  const [
    { count: totalUsuarios },
    { count: usuariosNuevosSemana },
    { count: postsActivos },
    { count: totalApps },
    { count: appsAceptadas },
    { count: totalMensajes },
    { count: usuariosVerificados },
    { data: usuariosRaw },
    { data: postsCategoria },
  ] = await Promise.all([
    service.from('users').select('*', { count: 'exact', head: true }),
    service.from('users').select('*', { count: 'exact', head: true }).gte('created_at', hace7d),
    service.from('posts').select('*', { count: 'exact', head: true }).eq('is_active', true),
    service.from('applications').select('*', { count: 'exact', head: true }),
    service.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'aceptado'),
    service.from('messages').select('*', { count: 'exact', head: true }),
    service.from('verifications').select('*', { count: 'exact', head: true }).eq('status', 'verificado'),
    service.from('users').select('created_at').gte('created_at', hace7d),
    service.from('posts').select('category').eq('is_active', true),
  ])

  // Usuarios nuevos por día (últimos 7 días)
  const diasLabel = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d
  })
  const usuariosPorDia = diasLabel.map(d => {
    const iso = d.toISOString().slice(0, 10)
    const count = (usuariosRaw ?? []).filter(u => u.created_at.slice(0, 10) === iso).length
    return { label: formatDia(iso), count }
  })
  const maxUsuariosDia = Math.max(...usuariosPorDia.map(d => d.count), 1)

  // Publicaciones por categoría
  const catConteo: Record<string, number> = {}
  for (const p of postsCategoria ?? []) {
    const cat = p.category ?? 'Sin categoría'
    catConteo[cat] = (catConteo[cat] ?? 0) + 1
  }
  const categorias = Object.entries(catConteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  const maxCat = Math.max(...categorias.map(([, v]) => v), 1)

  const tasaAceptacion = totalApps ? Math.round(((appsAceptadas ?? 0) / totalApps) * 100) : 0
  const pctVerificados = totalUsuarios ? Math.round(((usuariosVerificados ?? 0) / totalUsuarios) * 100) : 0

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">← Admin</Link>
      <h1 className="mt-1 text-2xl font-bold text-white">Métricas</h1>
      <p className="text-sm text-zinc-500">Estado general de Labu</p>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard titulo="Usuarios totales" valor={totalUsuarios?.toLocaleString('es-AR') ?? '–'} sub={`+${usuariosNuevosSemana ?? 0} esta semana`} />
        <StatCard titulo="Publicaciones activas" valor={postsActivos?.toLocaleString('es-AR') ?? '–'} />
        <StatCard titulo="Postulaciones enviadas" valor={totalApps?.toLocaleString('es-AR') ?? '–'} />
        <StatCard titulo="Tasa de aceptación" valor={`${tasaAceptacion}%`} sub={`${appsAceptadas ?? 0} aceptadas de ${totalApps ?? 0}`} color={tasaAceptacion > 30 ? 'text-green-400' : 'text-white'} />
        <StatCard titulo="Mensajes enviados" valor={totalMensajes?.toLocaleString('es-AR') ?? '–'} />
        <StatCard titulo="Usuarios verificados" valor={`${pctVerificados}%`} sub={`${usuariosVerificados ?? 0} de ${totalUsuarios ?? 0}`} color="text-blue-400" />
      </div>

      {/* Gráfico: usuarios por día */}
      <div className="mt-8 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">
        <h2 className="text-sm font-semibold text-white">Usuarios nuevos por día — últimos 7 días</h2>
        <div className="mt-5 flex items-end gap-2" style={{ height: '120px' }}>
          {usuariosPorDia.map(d => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-xs font-medium text-zinc-300">{d.count > 0 ? d.count : ''}</span>
              <div className="w-full rounded-t bg-blue-600" style={{ height: `${Math.max((d.count / maxUsuariosDia) * 88, d.count > 0 ? 4 : 0)}px` }} />
              <span className="text-[10px] text-zinc-600 text-center leading-tight">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico: categorías */}
      {categorias.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">
          <h2 className="text-sm font-semibold text-white">Publicaciones activas por categoría (top 10)</h2>
          <div className="mt-4 flex flex-col gap-2">
            {categorias.map(([cat, val]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-xs text-zinc-400">{cat}</span>
                <div className="flex-1 rounded-full bg-[#252525]" style={{ height: '8px' }}>
                  <div className="rounded-full bg-blue-500" style={{ width: `${(val / maxCat) * 100}%`, height: '8px' }} />
                </div>
                <span className="w-6 shrink-0 text-right text-xs text-zinc-400">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
