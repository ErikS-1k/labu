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
    layout.tsx                     → sidebar + bottom nav + botón flotante + Toaster
    panel/page.tsx                 → feed principal con filtros + OnboardingBanner
    ofertas/page.tsx               → feed de ofertas con filtros
    requerimientos/page.tsx        → feed de requerimientos con filtros
    buscar/page.tsx                → buscador global (perfiles + posts) con tabs
    post/[id]/page.tsx             → detalle de post + postulaciones + rating (sin teléfono)
    perfil/[id]/page.tsx           → perfil público/propio
    perfil/editar/page.tsx         → editar perfil + secciones LinkedIn + eliminar foto
    publicar/page.tsx              → crear nuevo post
    editar/[id]/page.tsx           → editar post propio
    mi-actividad/page.tsx          → tabs: Mis publicaciones + Mis trabajos
    mi-actividad/CalificarModal.tsx → modal de calificación (client component)
    mis-publicaciones/page.tsx     → redirect a /mi-actividad
    verificacion/page.tsx          → formulario DNI + explicación proceso
    mensajes/page.tsx              → lista de conversaciones (Realtime via ConversacionList)
    mensajes/[conversation_id]/page.tsx → chat individual (Supabase Realtime + smart scroll)
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
    Breadcrumbs.tsx           → breadcrumbs dinámicos
  ui/
    Toaster.tsx               → toasts efímeros (URL param + CustomEvent)
    ProgressBar.tsx           → barra de progreso NProgress en navegación
  onboarding/
    OnboardingBanner.tsx      → banner persistente 3 pasos (reemplaza el modal)
                                Paso 1: completar perfil (avatar+bio+location)
                                Paso 2: publicar (posts count > 0)
                                Paso 3: explorar (first_login = false)
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
  notifications.ts → crearNotificacion
  verificacion.ts  → subirVerificacion
  mensajes.ts      → enviarMensaje
  admin.ts         → aprobar/rechazar verificaciones
```

### lib/
```
lib/
  toast.ts         → showToast(message, type) — dispara CustomEvent 'labu:toast'
  useProgress.ts   → hook para NProgress (barra de carga en navegación)
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

## Últimos cambios (commits 0e8c314 + 206fd79)

| Área | Cambio |
|---|---|
| Onboarding | OnboardingModal → OnboardingBanner: banner persistente en /panel, detecta progreso desde datos reales (perfil + posts count + first_login) |
| Foto de perfil | Botón "Eliminar foto" en /perfil/editar con confirmación inline (no modal); elimina del bucket y limpia avatar_url |
| Mensajería — headers | Reemplaza "Re: [título del post]" por nombre + profesión/oficio del otro usuario |
| Mensajería — Realtime lista | ConversacionList.tsx: client component con suscripción Realtime; actualiza último mensaje y sube al tope sin recargar |
| Mensajería — scroll inteligente | Solo scrollea al fondo si el usuario ya estaba ahí; no interrumpe si está leyendo mensajes anteriores |
| Íconos | Wrench/briefcase en PostCard badges; íconos en FeedFilters tabs; dollar/clock/globe/map-pin en detalle de post; map-pin en perfil; calendar/users en mi-actividad |
| Landing page | Rediseño completo: hero con SVG de red + 4 secciones (características, categorías, cómo funciona, CTA) — tema 100% oscuro |
| Contraseña | Toggle mostrar/ocultar contraseña (ícono ojo) en login y registro |
| Contacto post-aceptación | Eliminado el teléfono del otro usuario al aceptar. Solo queda el botón "Iniciar conversación" como canal |
| Email en perfil | Campo "Email de contacto" en /perfil/editar — solo visible para el propio usuario |
| Safari | min-h-dvh→min-h-screen, backdrop-blur eliminado del nav, color-mix() reemplazado por rgba() explícito |

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
- ✅ Aceptar / rechazar postulaciones
- ✅ Al aceptar: solo se desbloquea el botón "Iniciar conversación" (sin teléfono)
- ✅ Marcar trabajo completado (doble confirmación cliente + trabajador)
- ✅ Ratings 1-5 estrellas post-trabajo

### Mi actividad
- ✅ Tab "Mis publicaciones": posts propios con conteos y acciones (menú editar/cerrar/eliminar)
- ✅ Tab "Mis trabajos": aplicaciones con estados y filtros por rol
- ✅ Calificación desde modal inline
- ✅ Marcar completado con toast

### Mensajería
- ✅ Chat con Supabase Realtime — mensajes aparecen sin recargar
- ✅ Lista de conversaciones con Realtime — último mensaje y orden se actualizan en tiempo real
- ✅ Smart scroll — solo baja al fondo si el usuario ya estaba ahí
- ✅ Header del chat muestra nombre + profesión del otro usuario (no título del post)
- ✅ Mensajes marcados como leídos al abrir la conversación
- ✅ Badge sidebar actualizado via router.refresh()

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
| Safari landing page rota | Tailwind v4 usa `color-mix()` para modificadores de opacidad (`/40`, `/20` etc.) — no soportado en Safari < 16.2. Fix: reemplazar con `rgba()` explícito en landing page. También: `min-h-dvh` → `min-h-screen`, `backdrop-blur` eliminado del nav |

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
