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
  page.tsx                         → landing con hero + 4 secciones explicativas
  (auth)/
    login/page.tsx                 → login
    registro/page.tsx              → registro (nombre + apellido + email + contraseña)
  (app)/
    layout.tsx                     → sidebar + bottom nav + botón flotante + Toaster
    panel/page.tsx                 → feed principal con filtros + onboarding modal
    ofertas/page.tsx               → feed de ofertas con filtros
    requerimientos/page.tsx        → feed de requerimientos con filtros
    buscar/page.tsx                → buscador global (perfiles + posts) con tabs
    post/[id]/page.tsx             → detalle de post + postulaciones + rating
    perfil/[id]/page.tsx           → perfil público/propio
    perfil/editar/page.tsx         → editar perfil + secciones LinkedIn
    publicar/page.tsx              → crear nuevo post
    editar/[id]/page.tsx           → editar post propio
    mi-actividad/page.tsx          → tabs: Mis publicaciones + Mis trabajos
    mi-actividad/CalificarModal.tsx → modal de calificación (client component)
    mis-publicaciones/page.tsx     → redirect a /mi-actividad
    verificacion/page.tsx          → formulario DNI + explicación proceso
    mensajes/page.tsx              → lista de conversaciones
    mensajes/[conversation_id]/page.tsx → chat individual (Supabase Realtime)
    mensajes/nuevo/page.tsx        → iniciar conversación nueva
    admin/verificaciones/page.tsx  → panel admin (solo ADMIN_EMAIL)
```

### Componentes clave
```
components/
  layout/
    PanelSidebar.tsx          → sidebar desktop, badge mensajes + notifs (Realtime)
    BottomNav.tsx             → nav mobile inferior, py-3 para touch targets 44px
    FloatingPublishMenu.tsx   → botón "+", oculto en /publicar, modal para guests
    NotificationBell.tsx      → campana con badge (Realtime)
  ui/
    Toaster.tsx               → toasts efímeros (URL param + CustomEvent)
  onboarding/
    OnboardingModal.tsx       → modal 3 pasos para usuarios nuevos (first_login)
  auth/
    LoginPromptModal.tsx      → modal reutilizable para acciones de guests
  posts/
    PublicarForm.tsx          → formulario controlado, validación por campo
    EditarPostForm.tsx        → editar post existente
    PostCard.tsx              → card del feed (border-zinc-700, p-5, text-base)
    FeedFilters.tsx           → filtros con búsqueda en tiempo real + debounce 300ms
    CerrarPostButton.tsx      → modal confirmación + useTransition + toast
    EliminarPostButton.tsx    → modal confirmación + useTransition + toast
    EmptyFeedState.tsx        → empty states inteligentes con mensajes cross-sell
    GuestPostAction.tsx       → botón de acción para usuarios no logueados en posts
    MarcarCompletadoButton.tsx → botón cliente con useTransition + toast
  panel/
    GuestPublishButtons.tsx   → botones de publicar para guests (abre modal)
  applications/
    PostularseForm.tsx        → postularse / solicitar, toast en state.ok
  ratings/
    RatingForm.tsx            → calificación 1-5 estrellas, toast en state.ok
  mensajes/
    ConversacionChat.tsx      → chat Realtime, input text-base (evita iOS zoom)
  search/
    SearchForm.tsx            → búsqueda en tiempo real con debounce 300ms
  perfil/
    EditarPerfilForm.tsx      → avatar upload a bucket "avatars"
    AgregarSeccionForm.tsx    → secciones estilo LinkedIn
```

### Server actions
```
app/actions/
  auth.ts          → registro (→ /panel?toast=bienvenido), login, logout
  perfil.ts        → actualizarPerfil, agregarSeccion, eliminarSeccion, completarOnboarding
  posts.ts         → publicarPost (→ toast), editarPost (→ toast), eliminarPost,
                     cerrarPost, marcarCompletado
  applications.ts  → postularse, aceptarPostulacion, rechazarPostulacion
  ratings.ts       → calificar
  notifications.ts → crearNotificacion
  verificacion.ts  → subirVerificacion
  mensajes.ts      → enviarMensaje
  admin.ts         → aprobar/rechazar verificaciones
```

### lib/
```
lib/
  toast.ts         → showToast(message, type) — dispara CustomEvent 'labu:toast'
  supabase/        → server.ts, client.ts, service.ts
```

---

## Base de datos — columnas relevantes

### Tabla `users`
```
first_login     boolean default true  — true = primer acceso, muestra onboarding
```

### Tabla `posts`
```
modality          text[]   — multi-select, ambos tipos de publicación
presencialidad    text     — 'presencial' | 'virtual' | 'ambos'
temporal_duration text     — duración estimada (cuando modality incluye 'temporal')
is_active         boolean
```

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

## Últimos cambios (commit 25e32e1)

| Área | Cambio |
|---|---|
| Landing page | Rediseñada con 4 secciones: Qué es Labu, Cómo funciona, Para quién, CTA final |
| Onboarding | Modal 3 pasos para usuarios nuevos (`first_login` en tabla `users`) |
| Toasts | Sistema global de notificaciones efímeras (URL param + CustomEvent) |
| Búsqueda | Tiempo real con debounce 300ms en feed principal y buscador lateral |
| Empty states | Mensajes inteligentes con cross-sell según tab y término buscado |
| Guests | Banner en feed, modal de login suave en acciones, botones visibles para todos |
| Mobile / iOS | `font-size: 16px` en inputs (evita zoom), `h-dvh` en layout, touch targets 44px |
| Cards del feed | Borde más visible (`border-zinc-700`), padding mayor (`p-5`), texto más contrastado |
| Bug fix | `buildParams` en FeedFilters reseteaba el tab al buscar — corregido |
| Botones | Aceptar/Rechazar en post detail agrandados; CerrarPostButton migrado a `useTransition` |

---

## Funcionalidades implementadas

Leyenda: ✅ funciona en producción · ⚠️ funciona con limitaciones · 🔜 pendiente

### Autenticación y perfil
- ✅ Registro con first_name + last_name → redirige a `/panel?toast=bienvenido`
- ✅ Perfil editable (bio, zona, headline, teléfono, foto)
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
- ✅ Aceptar / rechazar con desbloqueo de teléfono
- ✅ Marcar trabajo completado (doble confirmación cliente + trabajador)
- ✅ Ratings 1-5 estrellas post-trabajo

### Mi actividad
- ✅ Tab "Mis publicaciones": posts propios con conteos y acciones
- ✅ Tab "Mis trabajos": aplicaciones con estados y filtros por rol
- ✅ Calificación desde modal inline
- ✅ Marcar completado con toast

### Mensajería
- ✅ Chat con Supabase Realtime
- ✅ Mensajes marcados como leídos al abrir la conversación
- ✅ Badge sidebar actualizado via router.refresh()

### Toasts
- ✅ Sistema global: `showToast(message, type)` desde cualquier componente cliente
- ✅ Cubre: registro, publicar, editar, cerrar, eliminar, postularse, calificar, completar
- ✅ Duración 4s, animación, botón X manual

### Onboarding
- ✅ Modal 3 pasos para usuarios nuevos (`first_login = true`)
- ✅ "Hacer esto después" cierra y marca done — nunca vuelve a aparecer

### Landing page
- ✅ Hero + Qué es Labu + Cómo funciona + Para quién + CTA final
- ✅ Adapta CTAs si el usuario ya está logueado

### Notificaciones in-app
- ✅ Tabla `notifications`, Realtime, badge campana en sidebar
- ✅ Notificaciones para: postulación, aceptado/rechazado, trabajo completado, recordatorio calificación
- 🔜 Notificaciones push (V2)

### Verificación y admin
- ✅ Subir DNI → revisión manual → badge en perfil
- ✅ Panel admin en /admin/verificaciones

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

---

## Próximos pasos

### Producto (prioridad)
1. **Conseguir usuarios reales** — primeros 10–20 manualmente (CABA). Cold start es el mayor riesgo del marketplace.
2. **Feedback loop** — qué flujos confunden, qué falta, qué sobra.

### Mejoras técnicas (cuando el feedback lo pida)
- **Paginación** — feeds tienen límite fijo hoy; cuando haya volumen se nota
- **SEO** — metadata dinámica por post y perfil para indexado en Google
- **Validaciones robustas** en server actions (hoy son básicas)

### V2 (post-validación)
- Pagos con MercadoPago (escrow: deposita → Labu retiene → libera al completar)
- Notificaciones push
- Algoritmo de matching / recomendaciones
- App móvil nativa
