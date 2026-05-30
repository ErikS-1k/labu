# Labu — Handoff

## Objetivo del producto

Marketplace bidireccional de trabajo que cubre todos los rubros (oficios físicos, freelance, profesional/corporativo) y todas las modalidades (inmediato, temporal, permanente). Cualquier usuario puede publicar una oferta de trabajo o un requerimiento. El objetivo del MVP es validar la idea con usuarios reales antes de invertir en pagos, algoritmos o app móvil.

**Diferenciador clave:** ningún competidor (Zolvers, GetNinjas, Workana, LinkedIn) combina todos los rubros + todas las modalidades + bidireccionalidad en una sola plataforma.

---

## Estado actual del código

El MVP está completo y deployado en Vercel. Todas las funcionalidades principales están operativas.

### Stack
- **Framework:** Next.js 16 con App Router
- **Auth + DB + Storage:** Supabase
- **Estilos:** Tailwind CSS v4
- **Deploy:** Vercel (producción)

### Estructura de rutas
```
app/
  page.tsx                         → landing (fondo negro, dot grid)
  (auth)/
    login/page.tsx                 → login
    registro/page.tsx              → registro (nombre + apellido + email + contraseña)
  (app)/
    layout.tsx                     → sidebar + botón flotante para todas las páginas de la app
    panel/page.tsx                 → hub principal con tabs Ofertas / Requerimientos
    ofertas/page.tsx               → feed de ofertas con filtros
    requerimientos/page.tsx        → feed de requerimientos con filtros
    post/[id]/page.tsx             → detalle de post + postulaciones + rating
    perfil/[id]/page.tsx           → perfil público/propio
    perfil/editar/page.tsx         → editar perfil (lado a lado con Info Complementaria)
    publicar/page.tsx              → crear nuevo post
    editar/[id]/page.tsx           → editar post propio
    mi-actividad/page.tsx          → tabs: Mis publicaciones + Mis trabajos
    mi-actividad/CalificarModal.tsx → modal de calificación (client component)
    mis-publicaciones/page.tsx     → redirect a /mi-actividad
    verificacion/page.tsx          → explicación del proceso + formulario DNI
    mensajes/page.tsx              → lista de conversaciones
    mensajes/[conversation_id]/page.tsx → chat individual (Supabase Realtime)
    mensajes/nuevo/page.tsx        → iniciar conversación nueva
    admin/verificaciones/page.tsx  → panel admin (solo ADMIN_EMAIL)
```

### Componentes clave
```
components/
  layout/
    PanelSidebar.tsx         → sidebar con nav, badge mensajes (Realtime), badge notificaciones
    FloatingPublishMenu.tsx  → botón flotante "+", oculto en /publicar
    NotificationBell.tsx     → campana con badge (Realtime)
    HeaderNav.tsx            → mobile header con hamburger menu
  posts/
    PublicarForm.tsx         → formulario completo (controlled inputs, validación por campo)
    EditarPostForm.tsx       → editar post existente
    PostCard.tsx             → card del feed con stretched link pattern
    FeedFilters.tsx          → filtros de búsqueda
    CerrarPostButton.tsx     → modal de confirmación tipo-aware
    EliminarPostButton.tsx   → modal de confirmación con prop returnTo
  applications/
    PostularseForm.tsx       → postularse / solicitar un servicio
  ratings/
    RatingForm.tsx           → dejar calificación 1-5 estrellas
  mensajes/
    ConversacionChat.tsx     → chat con Realtime + router.refresh() al abrir
  perfil/
    EditarPerfilForm.tsx     → avatar upload a bucket "avatars"
    AgregarSeccionForm.tsx   → secciones estilo LinkedIn
```

### Server actions
```
app/actions/
  auth.ts         → registro, login, logout
  perfil.ts       → actualizarPerfil (con avatar upload), agregarSeccion, eliminarSeccion
  posts.ts        → publicarPost, editarPost, eliminarPost, cerrarPost, marcarCompletado
  applications.ts → postularse, aceptarPostulacion, rechazarPostulacion
  ratings.ts      → dejarRating
  notifications.ts → crearNotificacion
  verificacion.ts → subirVerificacion
  mensajes.ts     → enviarMensaje
  admin.ts        → aprobar/rechazar verificaciones
```

### Columnas relevantes en `posts`
```
modality          text[]    — múltiple, ambos tipos de publicación
presencialidad    text      — 'presencial' | 'virtual' | 'ambos'
temporal_duration text      — duración estimada (solo cuando modality incluye 'temporal')
is_active         boolean
```

> **SQL pendiente de ejecutar en Supabase si no se hizo:**
> ```sql
> ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS temporal_duration text;
> ```

### Supabase Storage buckets
- `avatars` — público, fotos de perfil
- `verificaciones` — privado, documentos DNI

### RLS — política UPDATE en messages
No existe política UPDATE en la tabla `messages`. El marcado como leído usa `createServiceClient()` (bypasea RLS) en el server component de la conversación. Si en el futuro se agrega la política:
```sql
create policy "El receptor puede marcar mensajes como leídos"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);
```
se puede volver a `createClient()`.

---

## Funcionalidades implementadas (acumulado)

### Base y autenticación
- Registro con first_name + last_name, login, logout
- Perfil editable (bio, zona, headline, teléfono, foto)
- Perfil estilo LinkedIn (secciones: experiencia, educación, certificados, proyectos, cursos)
- Perfil público (sin datos privados: phone, email, last_name)

### Publicaciones
- Crear y editar posts con todos los campos
- Tipo: "Ofrezco mis servicios" (oferta) o "Necesito contratar" (requerimiento)
- Modalidad: multi-select con botones para ambos tipos (Inmediato, Temporal, Por proyecto, Permanente)
- Presencialidad: Presencial / Virtual / Ambos (campo opcional)
- Duración estimada: aparece cuando modalidad incluye "Temporal" (campo opcional)
- Categorías predefinidas con botones + opción "Otro" (texto libre)
- Precio + unidad o "A convenir" por defecto
- Cerrar publicación (con modal de confirmación tipo-aware)
- Eliminar publicación (con modal de confirmación, permanente)
- El autor ve botón "Editar publicación" en el detalle, no Eliminar

### Feeds
- Feed de Ofertas y feed de Requerimientos con filtros (búsqueda, categoría, modalidad)
- Panel hub con tabs Ofertas / Requerimientos
- Cards con stretched link pattern (card entera clickeable → post, autor clickeable → perfil)
- Chips de modalidad, presencialidad y duración temporal en cards
- Autor clickeable desde cards y desde el detalle del post

### Interacción
- Sistema de postulaciones: postularse (requerimiento) / solicitar contacto (oferta)
- Aceptar / rechazar postulaciones con desbloqueo de teléfono
- Terminología diferenciada: "solicitar" para ofertas, "postularse" para requerimientos
- Marcar trabajo completado (doble confirmación: cliente + trabajador)
- Sistema de ratings 1-5 estrellas post-trabajo

### Mi actividad
- Tab "Mis publicaciones": lista de posts propios con conteo de postulaciones/solicitudes, botones Ver / Editar / Cerrar / Eliminar
- Tab "Mis trabajos": todas las postulaciones del usuario con estado (Esperando respuesta / En curso / No seleccionado / Completado)
- Filtros por rol: Todos / Como trabajador / Como cliente
- Botón "Marcar completado" inline en trabajos en curso
- Modal "Calificar" en trabajos completados sin calificación previa
- Eliminación desde Mi actividad usa `revalidatePath` (no redirige)

### Mensajería
- Chat individual con Supabase Realtime (INSERT events)
- Mensajes marcados como leídos en la DB al abrir la conversación (usa `createServiceClient`)
- Badge de mensajes no leídos en sidebar: se incrementa con Realtime INSERT, se actualiza via `router.refresh()` al abrir un chat (PanelSidebar sincroniza `count` con prop `unreadCount` cuando cambia)
- Badge de notificaciones en sidebar (campana)

### Confianza y admin
- Badge de verificación (subir DNI → revisión manual → badge en perfil)
- Panel admin para revisar verificaciones (/admin/verificaciones)
- Sistema de notificaciones in-app (tabla `notifications`, Realtime)

### UX
- Formulario de publicación: inputs controlados, validación por campo con mensajes de error, datos persistentes si hay error de servidor
- Botón flotante "+" oculto en /publicar
- Modales de confirmación personalizados (sin `confirm()` del browser)
- /mis-publicaciones redirige automáticamente a /mi-actividad

---

## CSS global (app/globals.css)
- Fondo: blanco en light mode, `#0a0a0a` en dark mode (automático por sistema)
- `input, textarea, select`: `color: #3f3f46` + `background-color: #ffffff` (forzado para evitar que el browser aplique fondo oscuro en dark mode)

---

## Problemas conocidos y soluciones aplicadas

### Inputs ilegibles en dark mode
`background-color: #ffffff` forzado en globals.css para inputs/textarea/select.

### Permisos en tabla notifications
Al recrear la tabla con SQL raw, los grants automáticos de Supabase no se aplican.
Fix: `GRANT ALL ON public.notifications TO postgres, service_role, authenticated, anon;`

### Mensajes no se marcaban como leídos
La tabla `messages` no tiene política UPDATE en RLS. El UPDATE con `createClient()` afectaba 0 filas sin error. Fix: usar `createServiceClient()` en el server component de la conversación.

### Badge del sidebar no se actualizaba al leer mensajes
`setCount(0)` en `useEffect([pathname])` era la única lógica de reset — incorrecta porque zeroeaba aunque hubiera no leídos en otras conversaciones. Fix: `router.refresh()` en `ConversacionChat` + `useEffect(() => setCount(unreadCount), [unreadCount])` en `PanelSidebar` para sincronizar cuando el layout re-fetchea.

### Eliminar desde Mi actividad redirigía fuera de la página
`eliminarPost` siempre redirigía al feed. Fix: prop `returnTo` en `EliminarPostButton` → el action hace `revalidatePath(returnTo)` y retorna en lugar de redirigir.

### Deploy — middleware deprecated
Next.js 16 deprecó `middleware.ts` / export `middleware`. Fix: renombrar a `proxy.ts` y función a `proxy`.

---

## Próximos pasos

### Producto (prioridad)
1. **Testing con usuarios reales** — conseguir los primeros 10–20 usuarios manualmente (CABA). El cold start es el mayor riesgo.
2. **Feedback loop** — qué flujos confunden, qué falta, qué sobra.

### Mejoras técnicas pendientes
- **Paginación** en feeds (ahora hay límite fijo de resultados)
- **SEO** — metadata dinámica por post y por perfil
- **Validaciones robustas** en server actions
- **Buscar** — página /buscar aún no implementada (aparece en sidebar)

### V2 (post-validación)
- Pagos con MercadoPago (escrow)
- Notificaciones push
- Algoritmo de matching / recomendaciones
- App móvil nativa
