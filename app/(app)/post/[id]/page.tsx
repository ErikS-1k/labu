import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PRICE_TYPES } from '@/lib/constants'
import { iniciarConversacion } from '@/app/actions/mensajes'
import { marcarCompletado } from '@/app/actions/posts'
import { aceptarPostulacion, rechazarPostulacion } from '@/app/actions/applications'
import RatingForm from '@/components/ratings/RatingForm'
import PostularseForm from '@/components/applications/PostularseForm'
import GuestPostAction from '@/components/posts/GuestPostAction'

const MODALITY_LABEL: Record<string, string> = {
  inmediato:   'Inmediato',
  temporal:    'Temporal',
  por_proyecto:'Por proyecto',
  permanente:  'Permanente',
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string; pid?: string }>
}) {
  const { id } = await params
  const { from, pid } = await searchParams
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('*, users(username, first_name, fecha_nacimiento, avatar_url, bio, location, rating_avg, rating_count, email, phone)')
    .eq('id', id)
    .eq('is_active', true)
    .single()


  if (!post) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const esAutor         = user?.id === post.user_id
  const esRequerimiento = post.type === 'requerimiento'

  // estaCompletado y estado de confirmaciones se leen desde la aplicación aceptada (ver más abajo)
  const puedeCalificar = !!user

  // Queries paralelas según el contexto
  const [
    { data: recientes },
    { data: yaCalifique },
    { data: miPostulacion },
    { data: postulaciones },
  ] = await Promise.all([
    // Últimas 3 aplicaciones completadas del autor (como cliente)
    supabase.from('applications')
      .select('id, completed_at, posts!inner(id, title, user_id)')
      .eq('posts.user_id', post.user_id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(3),

    // ¿Ya calificó este post?
    user
      ? supabase.from('ratings').select('id').eq('post_id', id).eq('from_user_id', user!.id).maybeSingle()
      : Promise.resolve({ data: null }),

    // Mi postulación o solicitud (si soy no-autor de cualquier post) — incluye estado de confirmación
    user && !esAutor
      ? supabase.from('applications')
          .select('id, status, message, confirmed_by_client, confirmed_by_worker, completed_at')
          .eq('post_id', id)
          .eq('applicant_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    // Todas las postulaciones/solicitudes (si soy el autor de cualquier post) — incluye estado de confirmación
    esAutor
      ? supabase.from('applications')
          .select('id, status, message, created_at, applicant_id, confirmed_by_client, confirmed_by_worker, completed_at, users(first_name, last_name, username, email, phone, rating_avg, rating_count)')
          .eq('post_id', id)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: null }),
  ])

  // Info de contacto del demandante (solo si mi postulación está aceptada)
  const postulacionAceptada = miPostulacion?.status === 'aceptado'

  // Estado de completado: viene de la aplicación aceptada, no del post
  const aplicacionAceptadaData = (postulaciones as any[])?.find((p: any) => p.status === 'aceptado') ?? null
  const appParaCompletado = esAutor ? aplicacionAceptadaData : (postulacionAceptada ? miPostulacion : null)
  const estaCompletado    = !!(appParaCompletado as any)?.completed_at
  const confirmedByClient = !!((appParaCompletado as any)?.confirmed_by_client)
  const confirmedByWorker = !!((appParaCompletado as any)?.confirmed_by_worker)

  const priceUnitLabel = PRICE_TYPES.find(p => p.value === post.price_type)?.label ?? ''
  const priceLabel = post.price
    ? `$${post.price.toLocaleString('es-AR')} ${priceUnitLabel}`
    : 'A convenir'

  const ORIGINS: Record<string, { label: string; href: string }> = {
    panel:          { label: 'Inicio',       href: '/panel' },
    busqueda:       { label: 'Búsqueda',     href: '/buscar' },
    'mi-actividad': { label: 'Mi actividad', href: '/mi-actividad' },
    perfil:         { label: 'Perfil',       href: pid ? `/perfil/${pid}` : '/panel' },
  }
  const origin = from ? ORIGINS[from] : null

  const autor = post.users as {
    username:         string | null
    first_name:       string | null
    fecha_nacimiento: string | null
    avatar_url:       string | null
    bio:              string | null
    location:         string | null
    rating_avg:       number | null
    rating_count:     number | null
    email:            string | null
    phone:            string | null
  } | null

  const autorNombre  = autor?.first_name ?? autor?.username ?? 'Usuario'
  const autorInicial = autorNombre[0].toUpperCase()

  function calcularEdad(fecha: string | null | undefined): number | null {
    if (!fecha) return null
    const hoy = new Date()
    const nac = new Date(fecha)
    let edad = hoy.getFullYear() - nac.getFullYear()
    const mDiff = hoy.getMonth() - nac.getMonth()
    if (mDiff < 0 || (mDiff === 0 && hoy.getDate() < nac.getDate())) edad--
    return edad
  }
  const autorEdad = calcularEdad(autor?.fecha_nacimiento)

  const AVATAR_COLORS = ['bg-violet-700', 'bg-blue-700', 'bg-emerald-700', 'bg-amber-700', 'bg-rose-700', 'bg-cyan-700']
  const avatarBg = (username: string | null | undefined) => {
    if (!username) return 'bg-zinc-600'
    return AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length]
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* Breadcrumb dinámico según origen */}
      {origin && (
        <nav className="mb-6 flex items-center gap-1.5 text-sm">
          <Link href={origin.href} className="text-zinc-400 transition-colors hover:text-white">
            {origin.label}
          </Link>
          <span className="text-zinc-500">›</span>
          <span className="font-medium text-white">{post.title}</span>
        </nav>
      )}

      {/* Tarjeta del post */}
      <div className="rounded-xl border border-surface-2 bg-surface-1 p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            post.type === 'oferta' ? 'bg-blue-900/40 text-blue-400' : 'bg-orange-900/40 text-orange-400'
          }`}>
            {post.type === 'oferta' ? 'Servicio' : 'Búsqueda'}
          </span>
          {(post.modality as string[]).includes('inmediato') && (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Inmediato
            </span>
          )}
          {post.category && (
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-zinc-400">
              {post.category}
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold text-white">{post.title}</h1>

        {post.description && (
          <p className="mt-4 text-sm leading-relaxed text-zinc-600">{post.description}</p>
        )}

        <div className="mt-6 flex flex-col gap-2 border-t border-zinc-100 pt-4 text-sm">
          {priceLabel && (
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Precio
              </span>
              <span className="font-medium text-white">{priceLabel}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Modalidad
            </span>
            <span className="text-zinc-700">
              {(post.modality as string[]).map(m => MODALITY_LABEL[m]).join(', ')}
            </span>
          </div>
          {(post.modality as string[]).includes('temporal') && (post as any).temporal_duration && (
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Duración
              </span>
              <span className="text-zinc-700">{(post as any).temporal_duration}</span>
            </div>
          )}
          {(post as any).presencialidad && (
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                Presencialidad
              </span>
              <span className="text-zinc-700">
                {(post as any).presencialidad === 'presencial' ? 'Presencial'
                 : (post as any).presencialidad === 'virtual' ? 'Virtual'
                 : 'Presencial / Virtual'}
              </span>
            </div>
          )}
          {post.location && (
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Zona
              </span>
              <span className="text-zinc-700">{post.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Botón de edición — solo el autor */}
      {esAutor && (
        <Link
          href={`/editar/${post.id}`}
          className="mt-4 block w-full rounded-xl border border-surface-2 py-2.5 text-center text-sm text-zinc-300 transition-colors hover:bg-surface-2 hover:text-white"
        >
          Editar publicación
        </Link>
      )}

      {/* Tarjeta del autor */}
      {autor && (
        <div className="mt-4 rounded-xl border border-surface-2 bg-surface-1 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Publicado por
          </p>
          <Link href={`/perfil/${post.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {autor?.avatar_url ? (
              <img src={autor.avatar_url} className="h-12 w-12 shrink-0 rounded-full object-cover" alt="" />
            ) : (
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${avatarBg(autor?.username)}`}>
                {autorInicial}
              </div>
            )}
            <div>
              <p className="font-semibold text-white">
                {autorNombre}{autorEdad !== null ? `, ${autorEdad}` : ''}
              </p>
              {(autor.rating_count ?? 0) > 0 && (
                <p className="text-xs text-zinc-400">
                  ★ {autor.rating_avg} · {autor.rating_count} calificaciones
                </p>
              )}
              {autor.location && (
                <p className="flex items-center gap-1 text-xs text-zinc-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {autor.location}
                </p>
              )}
            </div>
          </Link>

          {autor.bio && (
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">{autor.bio}</p>
          )}

          {recientes && recientes.length > 0 && (
            <div className="mt-4 border-t border-zinc-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Trabajos recientes
              </p>
              <ul className="flex flex-col gap-1.5">
                {(recientes as any[]).map(r => {
                  const rPost = r.posts as { id: string; title: string } | null
                  return (
                    <li key={r.id} className="flex items-center justify-between text-sm">
                      <Link href={`/post/${rPost?.id ?? '#'}?from=panel`} className="truncate text-zinc-700 hover:underline">
                        {rPost?.title ?? 'Trabajo completado'}
                      </Link>
                      <span className="ml-3 shrink-0 text-xs text-zinc-400">
                        {new Date(r.completed_at as string).toLocaleDateString('es-AR', {
                          day: 'numeric', month: 'short',
                        })}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

        </div>
      )}

      {/* ── OFERTAS: solicitudes de contacto ────────────────────── */}

      {/* Solicitante: contacto desbloqueado si fue aceptado */}
      {!esRequerimiento && postulacionAceptada && autor && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="mb-3 text-sm font-semibold text-green-800">
            ✓ Tu solicitud fue aceptada
          </p>
          <form action={iniciarConversacion} className="mt-4">
            <input type="hidden" name="post_id"     value={post.id} />
            <input type="hidden" name="receiver_id" value={post.user_id} />
            <button
              type="submit"
              className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-800"
            >
              Abrir conversación
            </button>
          </form>
        </div>
      )}

      {/* Solicitante: estado pendiente o rechazado */}
      {!esRequerimiento && miPostulacion && !postulacionAceptada && (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
          miPostulacion.status === 'rechazado'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-surface-2 bg-surface-2 text-zinc-400'
        }`}>
          {miPostulacion.status === 'pendiente' && 'Solicitud enviada · pendiente de revisión.'}
          {miPostulacion.status === 'rechazado' && 'Tu solicitud fue rechazada.'}
        </div>
      )}

      {/* Solicitante guest: prompt de login */}
      {!esRequerimiento && !user && !esAutor && !estaCompletado && (
        <GuestPostAction type="oferta" />
      )}

      {/* Solicitante: formulario si aún no envió solicitud */}
      {!esRequerimiento && user && !esAutor && !miPostulacion && !estaCompletado && (
        <div className="mt-4 rounded-xl border border-surface-2 bg-surface-1 p-5">
          <p className="mb-3 text-sm font-semibold text-zinc-800">Solicitar contacto</p>
          <PostularseForm
            postId={post.id}
            textoBoton="Enviar solicitud"
            placeholder="Contá brevemente para qué necesitás contratar este servicio (opcional)..."
            mensajeOk="Solicitud enviada. El oferente la revisará pronto."
          />
        </div>
      )}

      {/* Autor de la oferta: lista de solicitudes entrantes */}
      {!esRequerimiento && esAutor && (
        <div className="mt-4 rounded-xl border border-surface-2 bg-surface-1 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Solicitudes de contacto ({(postulaciones ?? []).length})
          </p>
          {(!postulaciones || postulaciones.length === 0) ? (
            <p className="text-sm text-zinc-400">Todavía no hay solicitudes.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {(postulaciones as any[]).map(p => {
                const ap = p.users as {
                  first_name: string | null; last_name: string | null
                  username: string | null; email: string | null
                  phone: string | null; rating_avg: number | null; rating_count: number | null
                } | null
                const nombre = [ap?.first_name, ap?.last_name].filter(Boolean).join(' ') || ap?.username || 'Usuario'
                return (
                  <div key={p.id} className={`rounded-lg border p-4 ${
                    p.status === 'aceptado' ? 'border-green-200 bg-green-50' :
                    p.status === 'rechazado' ? 'border-surface-2 bg-surface-1 opacity-60' :
                    'border-surface-2'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/perfil/${p.applicant_id}`}
                          target="_blank"
                          className="font-medium text-white hover:underline"
                        >
                          {nombre}
                        </Link>
                        {(ap?.rating_count ?? 0) > 0 && (
                          <p className="text-xs text-zinc-400">★ {ap?.rating_avg} · {ap?.rating_count} calificaciones</p>
                        )}
                        {p.message && (
                          <p className="mt-2 text-sm text-zinc-600">{p.message}</p>
                        )}
                      </div>
                      {p.status === 'pendiente' && (
                        <div className="flex shrink-0 gap-2">
                          <form action={aceptarPostulacion}>
                            <input type="hidden" name="application_id" value={p.id} />
                            <input type="hidden" name="post_id"        value={post.id} />
                            <button type="submit" className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
                              Aceptar
                            </button>
                          </form>
                          <form action={rechazarPostulacion}>
                            <input type="hidden" name="application_id" value={p.id} />
                            <input type="hidden" name="post_id"        value={post.id} />
                            <button type="submit" className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                              Rechazar
                            </button>
                          </form>
                        </div>
                      )}
                      {p.status !== 'pendiente' && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.status === 'aceptado' ? 'bg-green-900/40 text-green-400' : 'bg-surface-2 text-zinc-400'
                        }`}>
                          {p.status === 'aceptado' ? 'Aceptado' : 'Rechazado'}
                        </span>
                      )}
                    </div>
                    {p.status === 'aceptado' && (
                      <form action={iniciarConversacion} className="mt-3">
                        <input type="hidden" name="post_id"     value={post.id} />
                        <input type="hidden" name="receiver_id" value={p.applicant_id} />
                        <button type="submit" className="w-full rounded-lg bg-white px-4 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-200">
                          Iniciar conversación
                        </button>
                      </form>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── REQUERIMIENTOS: postulaciones ───────────────────────── */}

      {/* Postulante: contacto desbloqueado si fue aceptado */}
      {esRequerimiento && postulacionAceptada && autor && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="mb-3 text-sm font-semibold text-green-800">
            ✓ Tu postulación fue aceptada
          </p>
          <form action={iniciarConversacion} className="mt-4">
            <input type="hidden" name="post_id"     value={post.id} />
            <input type="hidden" name="receiver_id" value={post.user_id} />
            <button
              type="submit"
              className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-800"
            >
              Abrir conversación
            </button>
          </form>
        </div>
      )}

      {/* Postulante: estado pendiente o rechazado */}
      {esRequerimiento && miPostulacion && !postulacionAceptada && (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
          miPostulacion.status === 'rechazado'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-surface-2 bg-surface-2 text-zinc-400'
        }`}>
          {miPostulacion.status === 'pendiente' && 'Postulación enviada · pendiente de revisión.'}
          {miPostulacion.status === 'rechazado' && 'Tu postulación fue rechazada.'}
        </div>
      )}

      {/* Postulante guest: prompt de login */}
      {esRequerimiento && !user && !esAutor && !estaCompletado && (
        <GuestPostAction type="requerimiento" />
      )}

      {/* Postulante: formulario si aún no se postuló */}
      {esRequerimiento && user && !esAutor && !miPostulacion && !estaCompletado && (
        <div className="mt-4 rounded-xl border border-surface-2 bg-surface-1 p-5">
          <p className="mb-3 text-sm font-semibold text-zinc-800">Postularse</p>
          <PostularseForm postId={post.id} />
        </div>
      )}

      {/* Autor del requerimiento: lista de postulaciones */}
      {esRequerimiento && esAutor && (
        <div className="mt-4 rounded-xl border border-surface-2 bg-surface-1 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Postulaciones ({(postulaciones ?? []).length})
          </p>
          {(!postulaciones || postulaciones.length === 0) ? (
            <p className="text-sm text-zinc-400">Todavía no hay postulaciones.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {(postulaciones as any[]).map(p => {
                const ap = p.users as {
                  first_name: string | null; last_name: string | null
                  username: string | null; email: string | null
                  phone: string | null; rating_avg: number | null; rating_count: number | null
                } | null
                const nombre = [ap?.first_name, ap?.last_name].filter(Boolean).join(' ') || ap?.username || 'Usuario'
                return (
                  <div key={p.id} className={`rounded-lg border p-4 ${
                    p.status === 'aceptado' ? 'border-green-200 bg-green-50' :
                    p.status === 'rechazado' ? 'border-surface-2 bg-surface-1 opacity-60' :
                    'border-surface-2'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/perfil/${p.applicant_id}`}
                          target="_blank"
                          className="font-medium text-white hover:underline"
                        >
                          {nombre}
                        </Link>
                        {(ap?.rating_count ?? 0) > 0 && (
                          <p className="text-xs text-zinc-400">★ {ap?.rating_avg} · {ap?.rating_count} calificaciones</p>
                        )}
                        {p.message && (
                          <p className="mt-2 text-sm text-zinc-600">{p.message}</p>
                        )}
                      </div>
                      {p.status === 'pendiente' && (
                        <div className="flex shrink-0 gap-2">
                          <form action={aceptarPostulacion}>
                            <input type="hidden" name="application_id" value={p.id} />
                            <input type="hidden" name="post_id"        value={post.id} />
                            <button type="submit" className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
                              Aceptar
                            </button>
                          </form>
                          <form action={rechazarPostulacion}>
                            <input type="hidden" name="application_id" value={p.id} />
                            <input type="hidden" name="post_id"        value={post.id} />
                            <button type="submit" className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                              Rechazar
                            </button>
                          </form>
                        </div>
                      )}
                      {p.status !== 'pendiente' && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.status === 'aceptado' ? 'bg-green-900/40 text-green-400' : 'bg-surface-2 text-zinc-400'
                        }`}>
                          {p.status === 'aceptado' ? 'Aceptado' : 'Rechazado'}
                        </span>
                      )}
                    </div>
                    {p.status === 'aceptado' && (
                      <form action={iniciarConversacion} className="mt-3">
                        <input type="hidden" name="post_id"     value={post.id} />
                        <input type="hidden" name="receiver_id" value={p.applicant_id} />
                        <button type="submit" className="w-full rounded-lg bg-white px-4 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-200">
                          Iniciar conversación
                        </button>
                      </form>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MARCAR COMPLETADO / RATING ───────────────────────────── */}

      {(() => {
        if (estaCompletado) return null

        const soyTrabajadorAceptado = miPostulacion?.status === 'aceptado'

        // Autor del post (cliente en req / trabajador en oferta)
        if (esAutor && aplicacionAceptadaData) return (
          <div className="mt-4 rounded-xl border border-surface-2 bg-surface-1 p-5">
            {!confirmedByClient ? (
              <>
                <p className="mb-3 text-sm text-zinc-500">
                  ¿Terminó el trabajo? Confirmá la finalización. El trabajo se cierra cuando ambas partes confirmen.
                </p>
                <form action={marcarCompletado}>
                  <input type="hidden" name="post_id" value={post.id} />
                  <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-surface-2">
                    Confirmar finalización
                  </button>
                </form>
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                Confirmaste la finalización. Esperando que la otra parte también confirme.
              </p>
            )}
          </div>
        )

        // Postulante/solicitante aceptado
        if (soyTrabajadorAceptado && !estaCompletado) return (
          <div className="mt-4 rounded-xl border border-surface-2 bg-surface-1 p-5">
            {!confirmedByWorker ? (
              <>
                <p className="mb-3 text-sm text-zinc-500">
                  ¿Terminaste el trabajo? Confirmá la finalización. El trabajo se cierra cuando ambas partes confirmen.
                </p>
                <form action={marcarCompletado}>
                  <input type="hidden" name="post_id" value={post.id} />
                  <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-surface-2">
                    Confirmar finalización
                  </button>
                </form>
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                Confirmaste la finalización. Esperando que la otra parte también confirme.
              </p>
            )}
          </div>
        )

        return null
      })()}

      {estaCompletado && (
        <div className="mt-4 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-center text-sm font-medium text-green-700">
          Trabajo completado
        </div>
      )}

      {/* Rating — cada parte califica a la otra */}
      {(() => {
        if (!estaCompletado || !user) return null

        const soyTrabajadorAceptado = miPostulacion?.status === 'aceptado'

        // Autor del post califica al postulante aceptado
        if (esAutor && aplicacionAceptadaData) {
          const ap = aplicacionAceptadaData.users as { first_name: string | null; username: string | null } | null
          const otraParteNombre = ap?.first_name ?? ap?.username ?? 'la otra parte'
          if (yaCalifique) return <p className="mt-4 text-center text-sm text-zinc-400">Ya calificaste este trabajo.</p>
          return (
            <div className="mt-4 rounded-xl border border-surface-2 bg-surface-1 p-5">
              <RatingForm postId={post.id} toUserId={aplicacionAceptadaData.applicant_id} toUserName={otraParteNombre} />
            </div>
          )
        }

        // Postulante/solicitante aceptado califica al autor
        if (soyTrabajadorAceptado) {
          if (yaCalifique) return <p className="mt-4 text-center text-sm text-zinc-400">Ya calificaste este trabajo.</p>
          return (
            <div className="mt-4 rounded-xl border border-surface-2 bg-surface-1 p-5">
              <RatingForm postId={post.id} toUserId={post.user_id} toUserName={autorNombre} />
            </div>
          )
        }

        return null
      })()}
    </main>
  )
}
