# Labu — Handoff

## Objetivo del producto

Marketplace bidireccional de trabajo que cubre todos los rubros (oficios físicos, freelance, profesional/corporativo) y todas las modalidades (inmediato, temporal, permanente). Cualquier usuario puede publicar una oferta de trabajo o un requerimiento. El objetivo del MVP es validar la idea con usuarios reales antes de invertir en pagos, algoritmos o app móvil.

**Diferenciador clave:** ningún competidor (Zolvers, GetNinjas, Workana, LinkedIn) combina todos los rubros + todas las modalidades + bidireccionalidad en una sola plataforma.

---

## Estado actual del código

MVP completo y deployado en Vercel. Todas las funcionalidades principales están operativas.

### Stack
- **Framework:** Next.js 16 con App Router
- **Auth + DB + Storage:** Supabase
- **Estilos:** Tailwind CSS v4
- **Deploy:** Vercel (producción)

### Estructura de rutas
```
app/
  page.tsx                         → landing dark (hero + características + categorías + cómo funciona + CTA + footer)
  (auth)/
    login/page.tsx                 → login con toggle de contraseña
    registro/page.tsx              → registro (nombre + apellido + email + contraseña con toggle)
  (app)/
    layout.tsx                     → sidebar + bottom nav + botón flotante + Toaster + cuenta unreadActividadCount
    panel/page.tsx                 → feed principal con filtros + OnboardingBanner
    ofertas/page.tsx               → feed de ofertas con filtros
    requerimientos/page.tsx        → feed de requerimientos con filtros
    buscar/page.tsx                → buscador global (perfiles + posts) con tabs
    post/[id]/page.tsx             → detalle de post; postulaciones via PostulacionesAutorSection + MiPostulacionSection (Realtime)
    perfil/[id]/page.tsx           → perfil público/propio
    perfil/editar/page.tsx         → editar perfil + secciones LinkedIn + eliminar foto
    publicar/page.tsx              → crear nuevo post
    editar/[id]/page.tsx           → editar post propio
    mi-actividad/page.tsx          → tabs: Mis publicaciones + Mis trabajos
    mi-actividad/CalificarModal.tsx → modal de calificación (client component)
    mi-actividad/ActividadRealtimeSync.tsx → Realtime para refresh de mi-actividad (client, render null)
    mi-actividad/AutoMarcarActividadLeida.tsx → marca notificaciones de actividad como leídas al entrar (client, render null)
    mis-publicaciones/page.tsx     → redirect a /mi-actividad
    verificacion/page.tsx          → formulario DNI + explicación proceso
    mensajes/page.tsx              → lista de conversaciones (Realtime via ConversacionList)
    mensajes/[conversation_id]/page.tsx → chat individual (Supabase Realtime + smart scroll)
    mensajes/nuevo/page.tsx        → iniciar conversación nueva (sin lógica de dedup — vive en iniciarConversacion())
    admin/page.tsx                 → hub admin con 9 cards + contadores (solo ADMIN_EMAIL)
    admin/verificaciones/page.tsx  → revisar DNI pendientes + aprobar/rechazar
    admin/usuarios/page.tsx        → lista paginada, filtros, buscador, estado verificación
    admin/publicaciones/page.tsx   → lista paginada, filtros tipo/estado
    admin/postulaciones/page.tsx   → enriquecida: conv data, emails, expandible, filtro sin_conv
    admin/conversaciones/page.tsx  → deduplicado por conv_id (sin mostrar contenido)
    admin/notificaciones/page.tsx  → filtros por tipo y lectura
    admin/actividad/page.tsx       → feed 50 eventos de 5 tablas, auto-refresh 30s
    admin/metricas/page.tsx        → stat cards + CSS bar charts (usuarios/día, posts/categoría)
    admin/salud/page.tsx           → conteos por tabla + timestamps
```

### Componentes clave
```
components/
  layout/
    PanelSidebar.tsx          → sidebar desktop, badge mensajes + notifs + Mi Actividad (Realtime)
    BottomNav.tsx             → nav mobile inferior, py-3 para touch targets 44px
    FloatingPublishMenu.tsx   → botón "+", oculto en /publicar, modal para guests
    NotificationBell.tsx      → campana con badge (Realtime)
    Breadcrumbs.tsx           → breadcrumbs dinámicos
  ui/
    Toaster.tsx               → toasts efímeros (URL param + CustomEvent)
    ProgressBar.tsx           → barra de progreso NProgress en navegación
  onboarding/
    OnboardingBanner.tsx      → banner persistente 3 pasos (reemplaza el modal)
  auth/
    LoginPromptModal.tsx      → modal reutilizable para acciones de guests
  posts/
    PublicarForm.tsx          → formulario controlado, validación por campo
    EditarPostForm.tsx        → editar post existente
    PostCard.tsx              → card del feed con íconos de tipo (wrench/briefcase)
    PostActionsMenu.tsx       → menú de acciones (editar, cerrar, eliminar) en mi-actividad
    FeedFilters.tsx           → filtros con íconos en tabs + búsqueda en tiempo real + debounce 300ms
    CerrarPostButton.tsx      → modal confirmación + useTransition + toast
    EliminarPostButton.tsx    → modal confirmación + useTransition + toast
    EmptyFeedState.tsx        → empty states inteligentes con mensajes cross-sell
    GuestPostAction.tsx       → botón de acción para usuarios no logueados en posts
    MarcarCompletadoButton.tsx → botón cliente con useTransition + toast
  panel/
    GuestPublishButtons.tsx   → botones de publicar para guests (abre modal)
  applications/
    PostularseForm.tsx        → postularse / solicitar, toast en state.ok
    PostulacionesAutorSection.tsx → lista de postulaciones Realtime para el autor del post (INSERT en tiempo real)
    MiPostulacionSection.tsx  → estado de la postulación propia en tiempo real (UPDATE de status)
  ratings/
    RatingForm.tsx            → calificación 1-5 estrellas, toast en state.ok
  mensajes/
    ConversacionChat.tsx      → chat Realtime, smart scroll, input text-base (evita iOS zoom)
    ConversacionList.tsx      → lista de conversaciones con Realtime (client component)
  search/
    SearchForm.tsx            → búsqueda en tiempo real con debounce 300ms
  perfil/
    EditarPerfilForm.tsx      → avatar upload/eliminar, email, phone, all fields
    AgregarSeccionForm.tsx    → secciones estilo LinkedIn
    SeccionCard.tsx           → card de sección con edición inline
  notificaciones/
    NotificacionesList.tsx    → lista notificaciones con Realtime (client component)
```

### Server actions
```
app/actions/
  auth.ts          → registro (→ /panel?toast=bienvenido), login, logout
  perfil.ts        → actualizarPerfil (incluye email), agregarSeccion, editarSeccion,
                     eliminarSeccion, eliminarFoto, completarOnboarding
  posts.ts         → publicarPost (→ toast), editarPost (→ toast), eliminarPost,
                     cerrarPost, marcarCompletado
  applications.ts  → postularse, aceptarPostulacion, rechazarPostulacion
  ratings.ts       → calificar
  notifications.ts → crearNotificacion, marcarTodasLeidas, marcarActividadLeida
  verificacion.ts  → subirVerificacion
  mensajes.ts      → iniciarConversacion (incluye dedup de conversación), enviarMensaje
  admin.ts         → aprobar/rechazar verificaciones
```

### lib/
```
lib/
  toast.ts         → showToast(message, type) — dispara CustomEvent 'labu:toast'
  useProgress.ts   → hook para NProgress (barra de carga en navegación)
  constants.ts     → MODALIDADES, PRICE_TYPES, TIPOS_ACTIVIDAD
  avatar.ts        → avatarBg(...seeds) — color determinístico por usuario (hash de charCodes % 10)
  supabase/        → server.ts, client.ts, service.ts
```

---

## Base de datos — columnas relevantes

### Tabla `users`
```
first_login     boolean default true  — true = primer acceso, muestra onboarding banner
email           text                  — email de contacto, visible solo para el propio usuario
phone           text                  — teléfono, visible solo para el propio usuario (no se desbloquea más)
```

### Tabla `posts`
```
modality          text[]   — multi-select, ambos tipos de publicación
presencialidad    text     — 'presencial' | 'virtual' | 'ambos'
temporal_duration text     — duración estimada (cuando modality incluye 'temporal')
is_active         boolean
```

### Tabla `notifications`
```
type    text  — valores: 'nueva_postulacion' | 'postulacion_aceptada' | 'postulacion_rechazada' |
                         'trabajo_completado' | 'recordatorio_calificacion' | 'nuevo_mensaje' |
                         'nuevo_rating' | 'verificacion_aprobada' | 'verificacion_rechazada' | 'postulacion_enviada'
read    boolean
```

Los tipos de actividad (`TIPOS_ACTIVIDAD` en `lib/constants.ts`) son los que alimentan el badge de "Mi Actividad": nueva_postulacion, postulacion_aceptada, postulacion_rechazada, trabajo_completado, recordatorio_calificacion.

### Storage buckets
- `avatars` — público, fotos de perfil
- `verificaciones` — privado, documentos DNI

---

## SQL pendiente / ejecutado

### Ya ejecutado
```sql
-- Mensajes no leídos
GRANT ALL ON public.notifications TO postgres, service_role, authenticated, anon;

-- Duración temporal en posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS temporal_duration text;

-- Onboarding (first_login)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_login boolean DEFAULT true;
UPDATE public.users SET first_login = false;  -- usuarios existentes no ven onboarding
```

### RLS — política UPDATE en messages
No existe. El marcado como leído usa `createServiceClient()` en el server component de conversación. Si se agrega en el futuro:
```sql
create policy "El receptor puede marcar mensajes como leídos"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);
```

---

## Patrón Realtime — cómo está implementado en toda la app

Todos los componentes cliente que usan `postgres_changes` siguen este patrón obligatorio:

```typescript
useEffect(() => {
  const supabase = createClient()            // createClient() DENTRO del useEffect
  let channel: ReturnType<typeof supabase.channel> | undefined
  let cancelled = false

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (cancelled) return
    if (session?.access_token) supabase.realtime.setAuth(session.access_token) // JWT obligatorio
    channel = supabase
      .channel(`nombre-unico-${userId}`)     // nombre único por instancia
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tabla' },
        (payload) => {
          const row = payload.new as { user_id: string }
          if (row.user_id !== userId) return  // filtrar client-side, NO en el server filter
          // actualizar estado local
        })
      .subscribe()
  })

  return () => { cancelled = true; if (channel) supabase.removeChannel(channel) }
}, [userId])
```

**Por qué:** `@supabase/ssr`'s `createBrowserClient` NO pasa el JWT a la conexión WebSocket de Realtime automáticamente. Sin `setAuth()`, RLS ve `auth.uid() = null` y bloquea todos los eventos silenciosamente (el status muestra SUBSCRIBED pero no llegan eventos). El `cancelled` flag evita race conditions en React Strict Mode (doble mount).

**Configuración Supabase requerida:** La tabla debe estar habilitada en `supabase_realtime_messages_publication` (Dashboard → Database → Replication). Las tablas `notifications`, `messages` y `applications` ya están habilitadas.

---

## Arquitectura de auth guards

Todos los redirects de auth están centralizados en `proxy.ts` (raíz del proyecto). Las páginas ya **no tienen** `if (!user) redirect('/login')`.

`proxy.ts` maneja:
- `/mis-publicaciones` → redirect a `/mi-actividad` (sin auth check)
- `/perfil` (exacto, sin ID) → si no logueado → `/login`; si logueado → `/perfil/:id`
- `/admin` y `/admin/*` → solo `ADMIN_EMAIL`, cualquier otro (logueado o no) → `/`
- Resto de rutas protegidas (perfil/editar, mi-actividad, publicar, verificacion, mensajes/*, notificaciones, editar/*) → si no logueado → `/login`

Las páginas usan `user!.id` (non-null assertion) porque el proxy garantiza que el usuario existe antes de que la página se renderice.

---

## Últimos cambios (sesión 2026-09-10)

| Área | Cambio |
|---|---|
| Panel admin completo | 9 nuevas vistas en `/admin/*` — hub, usuarios, publicaciones, postulaciones, conversaciones, notificaciones, actividad, métricas, salud. Solo lectura. |
| `/admin/postulaciones` enriquecida | Conversación activa entre partes, estado de completion, ratings, emails internos colapsables, mensaje expandible con `<details>`, filtro "aceptadas sin conversación", ordenamiento por estado/actividad. |
| Fix crash `/perfil/editar` | Bug `??` vs `||` en `EditarPerfilForm.tsx:159` — `first_name = ""` causaba `undefined.toUpperCase()` → "This page couldn't load". Fix: `(first_name || username || 'U')`. |
| Upload foto | Soporte HEIC/HEIF/WEBP, límite 10MB, conversión automática client-side con `heic2any`. |
| Diseño admin | Rediseño de `/admin/verificaciones` al sistema visual actual. |

## Últimos cambios (sesión 2026-07-28)

| Área | Cambio |
|---|---|
| Confirmación de email | `emailRedirectTo` con `SITE_URL` (no `NEXT_PUBLIC_`). Callback en `app/auth/callback/route.ts`. Env var `SITE_URL=https://labu-six.vercel.app` en Vercel. |
| Selector de precio | `PublicarForm.tsx` y `EditarPostForm.tsx`: dos botones toggle (Precio fijo / A convenir) en lugar de checkbox. Estado `null` = sin elegir, `false` = a convenir, `true` = precio fijo. |
| PRICE_TYPES | Eliminado `a_convenir`. Agregado `semana`. `trabajo` renombrado a `por proyecto`. |
| Duración (antes Modalidad) | Renombrado "Modalidad" → "Duración" en toda la UI. MODALIDADES en constants.ts tiene campo `desc` por opción. |
| Avatares con color | `lib/avatar.ts`: `avatarBg(...seeds)` — hash de charCodes del primer seed no nulo, modulo 10 colores. Paleta: red, orange, amber, lime, emerald, teal, blue-600, violet, fuchsia, pink. Usado en PostCard, post/[id], perfil/[id], mi-actividad, buscar, EditarPerfilForm, ConversacionList. Fallback chain: username → first_name → user_id → post.id. |
| EditarPerfilForm | Recibe prop `userId` para usar como seed de avatar cuando username y first_name son null. |

## Últimos cambios (sesión 2026-06-07)

| Área | Cambio |
|---|---|
| Realtime — fix root cause | Root cause de todos los fallos Realtime: JWT no pasado al WebSocket. Fix: `supabase.realtime.setAuth(session.access_token)` en todos los useEffect de Realtime. Ver patrón arriba. |
| Postulaciones Realtime | `PostulacionesAutorSection.tsx`: autor ve nuevas postulaciones sin recargar. `MiPostulacionSection.tsx`: postulante ve cambio de estado (pendiente → aceptado/rechazado) sin recargar. |
| Badge "Mi Actividad" | Círculo rojo en sidebar idéntico al de mensajes. Realtime: se incrementa al llegar notificaciones de actividad. Reset al visitar /mi-actividad. Auto-marcar como leídas al entrar (AutoMarcarActividadLeida). |
| Auth guards centralizados | `proxy.ts` centraliza todos los redirects de auth. 11 páginas limpiadas del guard duplicado. Admin check también en proxy. |
| Dedup conversación | Eliminada verificación duplicada de conversación existente en `mensajes/nuevo/page.tsx`. Solo vive en `iniciarConversacion()` en `app/actions/mensajes.ts`. |
| Bug fix — use server | `TIPOS_ACTIVIDAD` movida a `lib/constants.ts`. Un archivo `'use server'` solo puede exportar funciones async. |

### Cambios anteriores (commits 0e8c314 → aa4653c)

| Área | Cambio |
|---|---|
| Onboarding | OnboardingModal → OnboardingBanner: banner persistente en /panel |
| Foto de perfil | Botón "Eliminar foto" con confirmación inline |
| Mensajería — headers | Nombre + profesión del otro usuario (no título del post) |
| Mensajería — Realtime lista | ConversacionList.tsx con suscripción Realtime |
| Mensajería — scroll inteligente | Solo scrollea al fondo si el usuario ya estaba ahí |
| Íconos | Wrench/briefcase en PostCard; íconos en FeedFilters, detalle de post, perfil, mi-actividad |
| Landing page | Rediseño completo: hero SVG + 4 secciones, tema 100% oscuro |
| Contraseña | Toggle mostrar/ocultar en login y registro |
| Contacto post-aceptación | Solo mensajería interna (sin teléfono) |
| Email en perfil | Campo "Email de contacto" visible solo para el propio usuario |
| Safari | min-h-dvh→min-h-screen, backdrop-blur eliminado del nav, color-mix() → rgba() explícito |
| Notificaciones — Realtime lista | NotificacionesList.tsx con Realtime |
| Notificaciones — marcar leídas | Update optimistic inmediato al entrar y al clickear |

---

## Funcionalidades implementadas

Leyenda: ✅ funciona en producción · ⚠️ funciona con limitaciones · 🔜 pendiente

### Autenticación y perfil
- ✅ Registro con first_name + last_name → redirige a `/panel?toast=bienvenido`
- ✅ Toggle mostrar/ocultar contraseña en login y registro
- ✅ Perfil editable (bio, zona, headline, teléfono, email, foto)
- ✅ Eliminar foto de perfil con confirmación inline
- ✅ Perfil estilo LinkedIn (secciones: experiencia, educación, certificados, proyectos, cursos)
- ✅ Perfil público sin datos privados (phone, email, last_name)

### Publicaciones
- ✅ Crear, editar, cerrar, eliminar posts
- ✅ Tipo: "Ofrezco mis servicios" (oferta) o "Necesito contratar" (requerimiento)
- ✅ Modalidad multi-select con botones (Inmediato, Temporal, Por proyecto, Permanente)
- ✅ Duración estimada opcional (aparece cuando modalidad = Temporal)
- ✅ Presencialidad: Presencial / Virtual / Ambos
- ✅ Categorías predefinidas + "Otro"
- ✅ Precio + unidad o "A convenir"
- ✅ Formulario: inputs controlados, validación por campo, datos persistentes ante error

### Feeds
- ✅ Panel hub con tabs Todos / Ofrece sus servicios / Necesita contratar
- ✅ Feeds de ofertas y requerimientos con filtros independientes
- ✅ Búsqueda en tiempo real con debounce 300ms
- ✅ Íconos en tabs de tipo (wrench = oferta, briefcase = requerimiento)
- ✅ Sección "Disponibles ahora" (posts con modalidad Inmediato)
- ✅ Cards legibles: borde visible, padding generoso, texto contrastado
- ✅ Empty states inteligentes con mensajes cross-sell según tab y término buscado
- ⚠️ Sin paginación — límite fijo de resultados (suficiente para MVP, escala cuando haya volumen)

### Buscador global (/buscar)
- ✅ Búsqueda en tiempo real con debounce
- ✅ Tabs: Todo / Perfiles / Servicios / Búsquedas
- ✅ Resultados de usuarios + posts en una pantalla
- ✅ Empty states inteligentes con mensajes cross-sell

### UX para usuarios no logueados
- ✅ Banner informativo en el feed principal
- ✅ Botones de publicar visibles pero abren modal de login
- ✅ GuestPostAction en detalle de post
- ✅ FloatingPublishMenu con modal de login para guests
- ✅ LoginPromptModal reutilizable en toda la app

### Interacción
- ✅ Sistema de postulaciones (solicitar en ofertas / postularse en requerimientos)
- ✅ Postulaciones en tiempo real: el autor ve nuevas postulaciones sin recargar
- ✅ Estado de postulación en tiempo real: el postulante ve aceptado/rechazado sin recargar
- ✅ Aceptar / rechazar postulaciones
- ✅ Al aceptar: solo se desbloquea el botón "Iniciar conversación" (sin teléfono)
- ✅ Marcar trabajo completado (doble confirmación cliente + trabajador)
- ✅ Ratings 1-5 estrellas post-trabajo

### Mi actividad
- ✅ Tab "Mis publicaciones": posts propios con conteos y acciones (menú editar/cerrar/eliminar)
- ✅ Tab "Mis trabajos": aplicaciones con estados y filtros por rol
- ✅ Calificación desde modal inline
- ✅ Marcar completado con toast
- ✅ Badge en sidebar: círculo rojo con contador Realtime; se resetea al visitar la página

### Mensajería
- ✅ Chat con Supabase Realtime — mensajes aparecen sin recargar
- ✅ Lista de conversaciones con Realtime — último mensaje y orden se actualizan en tiempo real
- ✅ Smart scroll — solo baja al fondo si el usuario ya estaba ahí
- ✅ Header del chat muestra nombre + profesión del otro usuario (no título del post)
- ✅ Mensajes marcados como leídos al abrir la conversación
- ✅ Badge sidebar actualizado via router.refresh()
- ✅ Sin duplicados de conversación: dedup centralizado en iniciarConversacion()

### Toasts
- ✅ Sistema global: `showToast(message, type)` desde cualquier componente cliente
- ✅ Cubre: registro, publicar, editar, cerrar, eliminar, postularse, calificar, completar
- ✅ Duración 4s, animación, botón X manual

### Onboarding
- ✅ Banner persistente 3 pasos en /panel para usuarios nuevos
- ✅ Paso 1: completar perfil (avatar + bio + zona detectados desde DB)
- ✅ Paso 2: hacer una publicación (count de posts del usuario)
- ✅ Paso 3: explorar (first_login = false al clickear "Explorar")
- ✅ Banner desaparece cuando los 3 pasos están completos

### Landing page
- ✅ Hero con ilustración SVG de red de nodos
- ✅ Sección características (4 items con íconos)
- ✅ Grilla de categorías (12 rubros, cada uno linkea a /buscar con filtro)
- ✅ Sección "Cómo funciona" (3 pasos)
- ✅ CTA final + Footer
- ✅ Tema 100% oscuro, consistente con el resto de la app
- ✅ Adapta CTAs si el usuario ya está logueado

### Notificaciones in-app
- ✅ Badge campana en sidebar con contador Realtime (incrementa sin recargar)
- ✅ Badge "Mi Actividad" en sidebar con contador Realtime (idem campana)
- ✅ Página /notificaciones con lista Realtime — nuevas notifs aparecen arriba al instante
- ✅ Auto-marcar notificaciones de actividad como leídas al entrar a /mi-actividad
- ✅ Marcar como leídas: optimistic update (puntos azules desaparecen inmediatamente)
- ✅ Tipos: postulación, aceptado/rechazado, trabajo completado, recordatorio calificación, ratings

### Verificación y admin
- ✅ Subir DNI → revisión manual → badge en perfil
- ✅ Panel admin completo (`/admin`) — 9 vistas de monitoreo, solo lectura
  - Hub, usuarios, publicaciones, postulaciones, conversaciones, notificaciones, actividad, métricas, salud
  - `/admin/postulaciones` enriquecida: conversación activa, completion, ratings, emails internos, filtro "aceptadas sin conversación", ordenamiento por estado/actividad
  - Protegidas por `proxy.ts` (ADMIN_EMAIL), no expuestas en la app pública

### SEO
- ⚠️ Metadata estática genérica — sin metadata dinámica por post o perfil
- 🔜 Metadata dinámica para indexado en Google

---

## CSS global y convenciones mobile

```css
/* globals.css */
input, textarea, select {
  font-size: 16px;  /* evita zoom automático en iOS al enfocar */
}
```

- Layout raíz usa `h-dvh` (no `h-screen`) para compatibilidad con Safari dynamic toolbar
- Chat usa `calc(100dvh - 57px)` por la misma razón
- BottomNav usa `py-3` en items para touch targets de ~44px
- Botones de aceptar/rechazar en post detail: `py-2.5 text-sm` (mínimo 44px)

---

## Problemas conocidos y soluciones

| Problema | Solución |
|---|---|
| Inputs ilegibles en dark mode | `background-color: #262626; color: white` en globals.css |
| iOS zoom al enfocar inputs | `font-size: 16px` global en inputs/textarea/select |
| Safari h-screen roto con toolbar dinámica | `h-dvh` en layout y sidebar, `100dvh` en chat |
| permissions denied en notifications | `GRANT ALL ON public.notifications TO ...` |
| Messages no se marcaban como leídos | `createServiceClient()` bypasea RLS (no hay UPDATE policy) |
| Badge sidebar no se actualizaba | `router.refresh()` en ConversacionChat + sync `useEffect` en PanelSidebar |
| Eliminar desde Mi actividad redirigía | prop `returnTo` en EliminarPostButton → `revalidatePath` en lugar de redirect |
| Tab se reseteaba al buscar | `buildParams` en FeedFilters arrancaba desde URLSearchParams vacío; fix: partir de `searchParams.toString()` |
| Deploy — middleware deprecated | Renombrar a `proxy.ts` y función a `proxy` |
| Safari landing page rota | Tailwind v4 usa `color-mix()` para modificadores de opacidad — no soportado en Safari < 16.2. Fix: reemplazar con `rgba()` explícito en landing page. También: `min-h-dvh` → `min-h-screen`, `backdrop-blur` eliminado del nav |
| Realtime no entregaba eventos (SUBSCRIBED pero silencioso) | Root cause: `@supabase/ssr` no pasa el JWT al WebSocket de Realtime. Fix: llamar `supabase.realtime.setAuth(session.access_token)` antes de subscribir. Sin esto, RLS ve `auth.uid() = null` y bloquea todo. |
| React Strict Mode: canal CLOSED en dev | `createClient()` fuera del useEffect + doble mount = canal stale. Fix: mover `createClient()` dentro del useEffect + flag `cancelled`. |
| `use server` no puede exportar objetos | `TIPOS_ACTIVIDAD` era exportada desde `notifications.ts` (archivo `use server`). Fix: moverla a `lib/constants.ts`. |

---

## Próximos pasos

### Producto (prioridad)
1. **Conseguir usuarios reales** — primeros 10–20 manualmente (CABA). Cold start es el mayor riesgo del marketplace.
2. **Feedback loop** — qué flujos confunden, qué falta, qué sobra.

### Mejoras técnicas (cuando el feedback lo pida)
- **Paginación** — feeds tienen límite fijo hoy; cuando haya volumen se nota
- **SEO** — metadata dinámica por post y perfil para indexado en Google
- **Validaciones robustas** en server actions (hoy son básicas)
- **Safari/Tailwind v4** — otros modificadores de opacidad en el resto de la app aún usan `color-mix()`; si hay reportes, reemplazarlos con `rgba()` del mismo modo que en landing

### V2 (post-validación)
- Pagos con MercadoPago (escrow: deposita → Labu retiene → libera al completar)
- Notificaciones push
- Algoritmo de matching / recomendaciones
- App móvil nativa
