@AGENTS.md

# Labu — Marketplace de Trabajo

## Quién soy
Soy Erik, 20 años, estudiante de Sistemas de Información en UBA (Facultad de Ciencias Económicas), Buenos Aires, Argentina. Estoy aprendiendo desarrollo web con The Odin Project (nivel básico, CSS/HTML). Uso Claude Code para construir este proyecto a la par de aprender. No soy desarrollador senior — explicame las decisiones importantes y avisame cuando algo pueda traer problemas a futuro.

---

## Qué es Labu
Marketplace bidireccional que conecta oferentes de trabajo con demandantes. Cubre todos los rubros sin distinción: oficios físicos (plomero, electricista, técnico), trabajo freelance (programador, diseñador) y trabajo profesional/corporativo.

Cualquier usuario puede ser oferente, demandante, o ambos al mismo tiempo. No hay roles separados.

### Modalidades de contratación
- **Inmediato** — el trabajo se necesita hoy o en las próximas horas
- **Temporal** — por un día, días o semanas definidos
- **Por proyecto** — dura hasta completar un proyecto específico
- **Permanente** — contratación estable, similar al modelo LinkedIn

### Modelo de negocio
- Marketplace puro: Labu no contrata a nadie, solo provee la plataforma
- Comisión por transacción completada (8–15%, a definir)
- En MVP: sin pagos integrados, validación manual
- En V2: escrow con MercadoPago (el demandante deposita, Labu retiene, libera al completar el trabajo)

### Problema del contacto
El perfil público muestra información general. El teléfono y email del postulante se desbloquean solo cuando el dueño de un requerimiento acepta la postulación — ambas partes ven el contacto del otro. El escrow y los pagos quedan para V2.

---

## Stack técnico
- **Framework:** Next.js 16 (v16.2.4) con App Router
- **Runtime:** React 19
- **Lenguaje:** TypeScript (siempre)
- **Base de datos + Auth + Realtime:** Supabase
- **Estilos:** Tailwind CSS v4
- **Deploy:** Vercel (producción)
- **Conversión de imágenes:** heic2any (HEIC → JPEG client-side)
- **Notificaciones push:** web-push (VAPID, server-side)
- **Pagos (V2):** MercadoPago API

---

## Estructura del proyecto
```
/app
  /page.tsx               → landing page (negra, pública)
  /auth/callback          → route handler para email confirmation (exchangeCodeForSession)
  /(auth)                 → login, registro (sin Header ni BottomNav)
  /(app)                  → todas las páginas con Header/BottomNav
    /panel                → hub principal post-login (feed unificado + CTAs publicar)
    /buscar               → buscador global (perfiles + publicaciones, tabs oferta/req)
    /ofertas              → feed de ofertas con filtros y búsqueda en tiempo real
    /requerimientos       → feed de requerimientos con filtros y búsqueda en tiempo real
    /post/[id]            → detalle de post + postulaciones + sección de contacto
    /editar/[id]          → editar publicación existente (solo el autor)
    /perfil/[id]          → perfil público/propio (hero, bio, experiencia, reseñas, publicaciones)
    /perfil/editar        → editar perfil + secciones LinkedIn
    /publicar             → crear nuevo post (oferta o requerimiento)
    /mensajes             → lista de conversaciones con badges de no leídos
    /mensajes/[id]        → chat individual con Realtime
    /mensajes/nuevo       → iniciar conversación nueva
    /mi-actividad         → mis publicaciones + mis postulaciones (con badges Realtime)
    /notificaciones       → lista de notificaciones + card de activación push (NotificacionesSection)
    /verificacion         → página explicativa + formulario subida DNI
    /admin                → hub del panel de admin (solo ADMIN_EMAIL)
    /admin/verificaciones → revisar y aprobar/rechazar DNI pendientes
    /admin/usuarios       → lista de usuarios con filtros y buscador
    /admin/publicaciones  → todas las publicaciones con filtros
    /admin/postulaciones  → postulaciones enriquecidas (conv, emails, estados)
    /admin/conversaciones → conversaciones (metadatos, sin contenido por privacidad)
    /admin/notificaciones → todas las notificaciones con filtros
    /admin/actividad      → feed cronológico de 50 eventos recientes (auto-refresh 30s)
    /admin/metricas       → stat cards + CSS bar charts
    /admin/salud          → conteos por tabla + timestamps de últimos registros
/components               → componentes reutilizables
  /pwa
    ServiceWorkerRegistration.tsx  → registra /sw.js solo en producción, escucha updates y mensajes NAVIGATE
    InstallBanner.tsx              → banner fijo "Instalar app" (beforeinstallprompt, localStorage)
    NotificacionesSection.tsx      → card de activación/desactivación push con estados A/B/C/D
  /onboarding
    OnboardingBanner.tsx           → banner 4 pasos (perfil, publicar, explorar, activar notificaciones)
/lib                      → clientes Supabase (server, client, service), utils
/app/actions              → server actions (auth, perfil, posts, mensajes, notifications, push, etc.)
  push.ts                          → enviarPushNotification, guardarPushSubscription, eliminarPushSubscription, verificarPushSubscription
/public
  manifest.json                    → Web App Manifest (PWA)
  sw.js                            → Service Worker (cache-first assets, network-first nav, push events)
  icons/                           → íconos PWA (72×72 a 512×512 + maskable)
/proxy.ts                 → auth guards + session refresh + legacy redirects (usado por middleware)
/supabase                 → schema.sql
```

---

## Base de datos (Supabase)

### Tabla: users
```
id               uuid (primary key, auth.users)
username         text (único)
first_name       text
last_name        text        (PRIVADO — solo visible en perfil propio y admin)
headline         text        (titular profesional, ej: "Electricista matriculado")
avatar_url       text
bio              text
location         text        (zona general, ej: "Palermo, CABA")
phone            text        (PRIVADO — visible solo al aceptar postulación)
email            text        (PRIVADO — visible solo al aceptar postulación)
fecha_nacimiento date        (PRIVADO — no se muestra en UI actualmente)
first_login      boolean     (default true — controla si mostrar onboarding)
onboarding_notifications_done boolean (default false — paso 4 del onboarding)
rating_avg       numeric     (calculado automáticamente por trigger)
rating_count     integer
created_at       timestamp
```

### Tabla: posts
```
id                uuid (primary key)
user_id           uuid (foreign key → users)
type              'oferta' | 'requerimiento'
title             text
description       text
category          text (categoría predefinida o personalizada)
modality          text[]  (array: 'inmediato' | 'temporal' | 'por_proyecto' | 'permanente')
presencialidad    text    (nullable: 'presencial' | 'virtual' | 'hibrido')
temporal_duration text    (nullable: duración estimada cuando modality incluye 'temporal')
price             numeric (nullable — null cuando es a convenir)
price_type        text    (nullable: 'hora' | 'dia' | 'semana' | 'mes' | 'trabajo')
                          ('trabajo' se muestra como "por proyecto" en la UI)
location          text
is_active         boolean
completed_at      timestamp (null = activo, fecha = completado)
created_at        timestamp
```

### Tabla: messages
```
id               uuid (primary key)
conversation_id  uuid
sender_id        uuid (foreign key → users)
receiver_id      uuid (foreign key → users)
post_id          uuid (foreign key → posts, nullable)
content          text
read             boolean
created_at       timestamp
```

### Tabla: ratings
```
id               uuid (primary key)
from_user_id     uuid (foreign key → users)
to_user_id       uuid (foreign key → users)
post_id          uuid (foreign key → posts)
score            integer (1–5)
comment          text
created_at       timestamp
```

### Tabla: applications
```
id                   uuid (primary key)
post_id              uuid (foreign key → posts) — el requerimiento al que se postula
applicant_id         uuid (foreign key → users) — el oferente que se postula
message              text — mensaje opcional del oferente
status               'pendiente' | 'aceptado' | 'rechazado'
confirmed_by_client  boolean (doble confirmación para marcar trabajo completado)
confirmed_by_worker  boolean (doble confirmación para marcar trabajo completado)
completed_at         timestamp (null = en progreso, fecha = completado)
created_at           timestamp
unique(post_id, applicant_id)
```

### Tabla: verifications
```
id               uuid (primary key)
user_id          uuid (foreign key → users)
type             'dni' | 'matricula' | 'portfolio'
status           'pendiente' | 'verificado' | 'rechazado'
document_url     text (path en Supabase Storage, bucket: verificaciones)
created_at       timestamp
```

### Tabla: profile_sections
```
id               uuid (primary key)
user_id          uuid (foreign key → users)
type             'experiencia' | 'educacion' | 'certificado' | 'proyecto' | 'curso'
title            text
subtitle         text
description      text
date_from        text
date_to          text
url              text
order            integer
created_at       timestamp
```

### Tabla: notifications
```
id               uuid (primary key)
user_id          uuid (foreign key → users)
type             text (ver TIPOS_ACTIVIDAD en lib/constants.ts)
message          text
link             text (ruta destino al hacer click)
read             boolean (default false)
created_at       timestamp
```
Tipos de notificación (`TIPOS_ACTIVIDAD`):
`nueva_postulacion` | `postulacion_aceptada` | `postulacion_rechazada` | `trabajo_completado` | `recordatorio_calificacion`

### Tabla: push_subscriptions
```
id         uuid (primary key)
user_id    uuid (foreign key → users, on delete cascade)
endpoint   text (unique — URL del push service del navegador)
p256dh     text (clave pública del cliente)
auth       text (secreto de autenticación)
created_at timestamp
```
RLS: usuarios solo gestionan sus propias filas (`auth.uid() = user_id`).
IMPORTANTE: usar el cliente de sesión del usuario (createClient) para operaciones propias.
Solo enviarPushNotification usa service role (lee suscripciones de otros usuarios).

### Storage buckets
- `verificaciones` — privado, documentos de identidad (DNI, imágenes/PDF)
- `avatars` — público, fotos de perfil (JPG, PNG, WEBP; HEIC se convierte a JPEG antes de subir)

---

## Funcionalidades del MVP

### Fase 1 — Base ✅
- [x] Autenticación (registro con first_name + last_name, login, logout)
- [x] Confirmación de email (route handler `/auth/callback`, env var `SITE_URL`)
- [x] Perfil de usuario (editar bio, zona, headline, teléfono, foto de perfil)
- [x] Subida de foto de perfil con soporte HEIC/WEBP/JPG/PNG hasta 10MB (conversión automática client-side)
- [x] Ver perfil público de otros usuarios (sin datos de contacto)
- [x] Perfil estilo LinkedIn (secciones: experiencia, educación, certificados, proyectos, cursos)
- [x] Avatares con color determinístico por usuario (lib/avatar.ts)

### Fase 2 — Core ✅
- [x] Publicar post (oferta o requerimiento) con todos los campos
- [x] Categorías predefinidas con selector visual + opción personalizada
- [x] Modalidades como botones seleccionables (Inmediato / Temporal / Por proyecto / Permanente)
- [x] Presencialidad en publicaciones (Presencial / Virtual / Híbrido)
- [x] Precio fijo o "A convenir" (toggle selector)
- [x] Editar publicaciones existentes (/editar/[id])
- [x] Modales de confirmación para Cerrar y Eliminar publicaciones
- [x] Feed de Ofertas con filtros (búsqueda, categoría, duración)
- [x] Feed de Requerimientos con filtros
- [x] Búsqueda en tiempo real sin Enter (debounce 300ms, cursor-based pagination)
- [x] Feed unificado en /panel con sección "Disponibles ahora" (inmediato)
- [x] Buscador global /buscar (perfiles + publicaciones, tabs oferta/req)
- [x] Ver detalle de un post con tarjeta del autor y sección de contacto
- [x] Link al perfil del autor desde las publicaciones
- [x] Banner para usuarios no logueados con CTA registro
- [x] Mensajes sin resultados con CTA contextual (publicar / registrarse)
- [x] Botones "Publicar mi servicio" y "Publicar una búsqueda" en el feed

### Fase 3 — Interacción ✅
- [x] Sistema de mensajería interna (Supabase Realtime, mensajes se marcan leídos al abrir)
- [x] Sistema de postulaciones (postularse a requerimientos, aceptar/rechazar, desbloqueo de contacto)
- [x] Flujo de aceptar/rechazar con Realtime para autor y postulante
- [x] Doble confirmación para marcar trabajo completado (cliente + trabajador)
- [x] Sistema de ratings y reviews (1-5 estrellas + comentario, post-trabajo)
- [x] Historial de trabajos completados en el perfil
- [x] Mi actividad — Mis publicaciones (con menú acciones) + Mis postulaciones

### Fase 4 — Confianza y retención ✅
- [x] Badge de verificación (subir DNI → revisión manual → badge en perfil)
- [x] Panel admin para revisar verificaciones (/admin/verificaciones, solo ADMIN_EMAIL)
- [x] Sección "Inmediato" destacada en el feed con dot verde
- [x] PWA instalable (manifest.json + service worker /sw.js, prioridad Android Chrome)
- [x] Notificaciones push nativas (VAPID + Supabase push_subscriptions + web-push)
  - Trigger en: nuevo mensaje, nueva postulación, postulación aceptada
  - Gestión desde /notificaciones (activar / desactivar / reintentar si inconsistente)
- [x] Banner de instalación PWA (beforeinstallprompt, dismissible 14 días)
- [x] Onboarding de 4 pasos (completar perfil, publicar, explorar, activar notificaciones)

### Infraestructura y UX ✅
- [x] Deploy en Vercel (producción)
- [x] Landing page dark con explicación de Labu, categorías, cómo funciona y CTA
- [x] Auth guards centralizados en proxy.ts (session refresh + redirecciones)
- [x] Sidebar desktop con badges Realtime (mensajes + notificaciones + actividad)
- [x] BottomNav mobile con badges de no leídos
- [x] MobileHeader con títulos grandes por página y campana de notificaciones
- [x] Campana de notificaciones en tiempo real (badge con contador)
- [x] Página /notificaciones con agrupación por tipo+día y auto-marcar al ver
- [x] Notificaciones toast globales (showToast desde cualquier client component)
- [x] Onboarding para usuarios nuevos (banner 4 pasos: completar perfil, publicar, explorar, activar notificaciones)
- [x] Breadcrumbs contextuales (navegación desde post → perfil)
- [x] FloatingPublishMenu (botón flotante con opciones publicar, visible en mobile)
- [x] Barra de progreso NProgress en navegación entre páginas
- [x] Optimización mobile (Safari, Chrome; rgba() explícito en landing para compat. Safari < 16.2)
- [x] Soporte HEIC/HEIF para subida de fotos (conversión automática a JPEG en el cliente)
- [x] Panel admin completo (/admin) — 9 vistas de monitoreo: hub, usuarios, publicaciones, postulaciones, conversaciones, notificaciones, actividad, métricas, salud
- [x] /admin/postulaciones enriquecida: conversación activa, emails internos, completion status, filtro "aceptadas sin conversación", ordenamiento

### NO construir en MVP (V2+)
- Pagos / escrow con MercadoPago
- Recomendaciones por IA
- Verificación de competencias avanzada
- App móvil nativa
- Algoritmo de matching
- Paginación infinita en feeds (actualmente límite fijo)
- SEO dinámico por post/perfil

---

## Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=              ← panel admin + enviarPushNotification (bypasa RLS)
ADMIN_EMAIL=                            ← email del admin para acceder a /admin
SITE_URL=                               ← URL base (http://localhost:3000 en dev, https://... en prod)
                                          Usada en email confirmation redirect. NO usar NEXT_PUBLIC_.
NEXT_PUBLIC_VAPID_PUBLIC_KEY=           ← clave pública VAPID para push notifications
VAPID_PRIVATE_KEY=                      ← clave privada VAPID (solo servidor)
VAPID_EMAIL=mailto:erikshin2005@gmail.com
```

---

## Reglas de desarrollo

### Código
- Siempre TypeScript, nunca JavaScript
- Comentarios en español
- Server Components por defecto, Client Components solo cuando sea necesario (interactividad, hooks)
- No instalar librerías nuevas sin consultarme primero
- Manejar siempre los estados de loading y error en el frontend

### Base de datos
- No modificar el schema sin avisarme y explicarme el impacto
- Siempre usar Row Level Security (RLS) en Supabase
- No exponer datos privados (phone, email, last_name) en queries públicas
- `last_name` solo visible en perfil propio y panel admin
- `phone` y `email` solo visibles cuando una postulación está aceptada (ambas partes)

### Visibilidad de datos de usuarios
| Contexto | Qué mostrar |
|---|---|
| Perfil público (ajeno) | first_name, headline, bio, location, rating |
| Perfil propio | first_name + last_name, todos los campos |
| Post (tarjeta autor) | first_name, bio, location, rating |
| Postulación aceptada | + phone y email del otro |
| Admin | todo |

### Patrón Realtime (crítico — no romper)
Todos los `useEffect` con suscripción Realtime deben seguir este patrón exacto:
1. `createClient()` DENTRO del useEffect (no fuera)
2. `supabase.auth.getSession()` → `supabase.realtime.setAuth(access_token)` antes de subscribir
3. Flag `cancelled = false` para evitar race condition en React Strict Mode
4. Nombre de canal único por instancia (ej. `notif-bell-${userId}`)
5. Filtrar client-side, NO usar `filter:` en postgres_changes

Sin `setAuth()`, RLS bloquea todos los eventos silenciosamente (canal aparece como SUBSCRIBED pero no llegan datos).

### Estilo
- Mobile-first (la mayoría de usuarios van a entrar desde el celular)
- Diseño limpio y premium — espaciado generoso, dark aesthetic
- Tailwind puro, sin CSS custom salvo que sea estrictamente necesario
- Sistema de colores base: `surface-0` (#000), `surface-1` (#141414), `surface-2` (#252525), `surface-3` (#303030)
- Cards: `bg-[#171717] rounded-2xl border border-[#2a2a2a]`
- Inputs: `bg-[#111] border-[#2a2a2a] rounded-xl`
- CTAs principales: gradiente azul `from-blue-600 to-blue-700`
- Íconos de sección: círculos con color de acento suave (blue/violet/green/orange/yellow)
- Usar el azul de Labu estratégicamente para reforzar identidad, no en todos lados

### Comunicación
- Si una decisión técnica tiene tradeoffs importantes, explicámelos antes de implementar
- Si algo que pedí puede generar problemas a futuro, avisame
- Prefiero entender qué estás construyendo, no solo que funcione

---

## Contexto de mercado (para decisiones de producto)
- Competidores principales: Zolvers, GetNinjas, Workana, LinkedIn
- Ninguno combina todas las modalidades + todos los rubros + bidireccionalidad
- Mercado objetivo inicial: CABA, Argentina
- El cold start es el mayor riesgo: hay que conseguir oferentes manualmente antes de escalar
- Precios siempre en ARS, con opción futura de USD
