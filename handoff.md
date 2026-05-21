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
    layout.tsx                     → agrega Header a todas las páginas de la app
    panel/page.tsx                 → hub principal con tabs Ofertas / Requerimientos
    ofertas/page.tsx               → feed de ofertas con filtros
    requerimientos/page.tsx        → feed de requerimientos con filtros
    post/[id]/page.tsx             → detalle de post + postulaciones + rating
    perfil/[id]/page.tsx           → perfil público/propio
    perfil/editar/page.tsx         → editar perfil (lado a lado con Info Complementaria)
    verificacion/page.tsx          → explicación del proceso + formulario DNI
    mensajes/page.tsx              → lista de conversaciones
    mensajes/[conversation_id]/page.tsx → chat individual (Supabase Realtime)
    mensajes/nuevo/page.tsx        → iniciar conversación nueva
    admin/verificaciones/page.tsx  → panel admin (solo ADMIN_EMAIL)
```

### Componentes clave
```
components/
  layout/Header.tsx          → server component, obtiene first_name del usuario
  layout/HeaderNav.tsx       → client component (hamburger menu mobile)
  auth/RegistroForm.tsx      → campos apilados verticalmente (fix overflow)
  auth/LoginForm.tsx
  perfil/EditarPerfilForm.tsx → incluye avatar upload a bucket "avatars"
  perfil/AgregarSeccionForm.tsx → agregar secciones estilo LinkedIn
  posts/PublicarForm.tsx
  posts/FeedFilters.tsx
  posts/PostCard.tsx
  applications/PostularseForm.tsx
  ratings/RatingForm.tsx
  verificacion/VerificacionForm.tsx → upload DNI a bucket "verificaciones"
  mensajes/ConversacionChat.tsx → chat con Supabase Realtime
```

### Server actions
```
app/actions/
  auth.ts         → registro, login, logout
  perfil.ts       → actualizarPerfil (con avatar upload), agregarSeccion, eliminarSeccion
  posts.ts        → crearPost, marcarCompletado
  applications.ts → postularse, aceptar/rechazar
  ratings.ts      → dejarRating
  verificacion.ts → subirVerificacion
  mensajes.ts     → enviarMensaje
  admin.ts        → aprobar/rechazar verificaciones
```

### Supabase Storage buckets
- `avatars` — público, fotos de perfil
- `verificaciones` — privado, documentos DNI

### CSS global (app/globals.css)
- Fondo: blanco en light mode, `#0a0a0a` en dark mode (automático por sistema)
- `input, textarea, select`: `color: #3f3f46` + `background-color: #ffffff` (forzado para evitar que el browser aplique fondo oscuro en dark mode)

---

## Archivos editados en esta sesión

| Archivo | Qué se cambió |
|---|---|
| `app/(app)/perfil/editar/page.tsx` | Layout side-by-side (Editar perfil + Info Complementaria), títulos con `text-foreground`, renombrar sección |
| `components/perfil/AgregarSeccionForm.tsx` | Agregado `bg-white` al form, border `zinc-200` → `zinc-300` |
| `components/auth/RegistroForm.tsx` | Campos Nombre y Apellido apilados verticalmente en vez de lado a lado |
| `app/globals.css` | Agregado `background-color: #ffffff` a inputs/textarea/select |

---

## Lo que se probó y falló

### Registro — apellido overflow (primera solución)
- **Intento:** agregar `min-w-0` y `w-full` a los inputs manteniendo el layout horizontal (`flex gap-3`)
- **Por qué falló:** el container `max-w-sm` (384px) con `p-8` solo deja ~320px, que no alcanza para dos inputs lado a lado
- **Solución que funcionó:** apilar los campos verticalmente, cada uno con su propio `flex flex-col gap-1`

### Deploy en Vercel — middleware deprecated
- **Intento:** usar `middleware.ts` con función exportada como `middleware`
- **Por qué falló:** Next.js 16 deprecó el nombre `middleware.ts` / export `middleware`
- **Solución que funcionó:** renombrar el archivo a `proxy.ts` y la función a `proxy`

### Rutas duplicadas en Vercel
- **Problema:** al mover rutas a `(app)/` con `mv`, git trackeó los archivos viejos como "eliminados" pero los nuevos como "untracked". Se hizo push de los nuevos sin los deletes → Vercel vio ambas rutas activas
- **Solución:** `git add -A` para stagear también las eliminaciones, luego commit y push

### Inputs ilegibles en dark mode
- **Primera solución:** agregar `color: #3f3f46` en globals.css → texto visible, pero browsers de dark mode podían igualmente aplicar fondo oscuro al input
- **Segunda solución (esta sesión):** agregar también `background-color: #ffffff` → fondo siempre blanco, texto siempre legible

---

## Próximos pasos

El MVP visual/funcional está completo. Lo que sigue es producto, no código:

### Inmediato
1. **Testing con usuarios reales** — conseguir los primeros 10–20 usuarios manualmente (CABA). El cold start es el mayor riesgo del producto.
2. **Feedback loop** — ver qué flujos confunden a los usuarios, qué les falta, qué sobra.

### Mejoras técnicas pendientes (si el feedback lo pide)
- **Notificaciones** — avisarle al usuario cuando recibe una postulación, mensaje o calificación (Supabase Realtime o email)
- **Paginación** en feeds (ahora hay límite fijo de 20 resultados)
- **SEO** — mejorar metadata dinámica por post y por perfil
- **Validaciones más robustas** en server actions (ahora son básicas)

### V2 (post-validación)
- Pagos con MercadoPago (escrow: demandante deposita → Labu retiene → libera al completar)
- Sistema de notificaciones push
- Algoritmo de matching / recomendaciones
- App móvil nativa
