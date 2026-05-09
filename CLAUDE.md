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
- **Temporal** — por un día, días, semanas o meses definidos
- **Permanente** — contratación estable, similar al modelo LinkedIn

### Modelo de negocio
- Marketplace puro: Labu no contrata a nadie, solo provee la plataforma
- Comisión por transacción completada (8–15%, a definir)
- En MVP: sin pagos integrados, validación manual
- En V2: escrow con MercadoPago (el demandante deposita, Labu retiene, libera al completar el trabajo)

### Problema del contacto
El perfil público muestra información general. El teléfono se desbloquea solo cuando el dueño de un requerimiento acepta una postulación — ambas partes ven el contacto del otro. El email completo y los pagos quedan para V2.

---

## Stack técnico
- **Framework:** Next.js 16 con App Router
- **Lenguaje:** TypeScript (siempre)
- **Base de datos + Auth + Realtime:** Supabase
- **Estilos:** Tailwind CSS
- **Deploy:** Vercel (producción)
- **Pagos (V2):** MercadoPago API

---

## Estructura del proyecto
```
/app
  /page.tsx               → landing page (negra, pública)
  /(auth)                 → login, registro (sin Header)
  /(app)                  → todas las páginas con Header
    /panel                → hub principal post-login (tabs Ofertas/Reqs)
    /ofertas              → feed de ofertas
    /requerimientos       → feed de requerimientos
    /post/[id]            → detalle de post + postulaciones
    /perfil/[id]          → perfil público/propio
    /perfil/editar        → editar perfil + secciones LinkedIn
    /publicar             → crear nuevo post
    /mensajes             → lista de conversaciones
    /mensajes/[id]        → chat individual
    /mensajes/nuevo       → iniciar conversación
    /verificacion         → página explicativa + formulario DNI
    /admin/verificaciones → panel admin (solo ADMIN_EMAIL)
/components               → componentes reutilizables
/lib                      → clientes Supabase (server, client, service)
/app/actions              → server actions (auth, perfil, posts, etc.)
/supabase                 → schema.sql
```

---

## Base de datos (Supabase)

### Tabla: users
```
id              uuid (primary key, auth.users)
username        text (único)
first_name      text
last_name       text  (PRIVADO — solo visible en perfil propio y admin)
headline        text  (titular profesional, ej: "Electricista matriculado")
avatar_url      text
bio             text
location        text  (zona general, ej: "Palermo, CABA")
phone           text  (PRIVADO — se desbloquea al aceptar una postulación)
email           text  (PRIVADO — nunca visible en MVP)
rating_avg      numeric (calculado automáticamente por trigger)
rating_count    integer
created_at      timestamp
```

### Tabla: posts
```
id              uuid (primary key)
user_id         uuid (foreign key → users)
type            'oferta' | 'requerimiento'
title           text
description     text
category        text (plomería, electricidad, programación, etc.)
modality        text[]  (array: puede ser ['inmediato'], ['temporal','permanente'], etc.)
price           numeric
price_type      'hora' | 'dia' | 'trabajo' | 'mes' | 'a_convenir'
location        text
is_active       boolean
completed_at    timestamp (null = activo, fecha = completado)
created_at      timestamp
```

### Tabla: messages
```
id              uuid (primary key)
conversation_id uuid
sender_id       uuid (foreign key → users)
receiver_id     uuid (foreign key → users)
post_id         uuid (foreign key → posts, nullable)
content         text
read            boolean
created_at      timestamp
```

### Tabla: ratings
```
id              uuid (primary key)
from_user_id    uuid (foreign key → users)
to_user_id      uuid (foreign key → users)
post_id         uuid (foreign key → posts)
score           integer (1–5)
comment         text
created_at      timestamp
```

### Tabla: applications
```
id              uuid (primary key)
post_id         uuid (foreign key → posts) — el requerimiento al que se postula
applicant_id    uuid (foreign key → users) — el oferente que se postula
message         text — mensaje opcional del oferente
status          'pendiente' | 'aceptado' | 'rechazado'
created_at      timestamp
unique(post_id, applicant_id)
```

### Tabla: verifications
```
id              uuid (primary key)
user_id         uuid (foreign key → users)
type            'dni' | 'matricula' | 'portfolio'
status          'pendiente' | 'verificado' | 'rechazado'
document_url    text (path en Supabase Storage, bucket: verificaciones)
created_at      timestamp
```

### Tabla: profile_sections
```
id              uuid (primary key)
user_id         uuid (foreign key → users)
type            'experiencia' | 'educacion' | 'certificado' | 'proyecto' | 'curso'
title           text
subtitle        text
description     text
date_from       text
date_to         text
url             text
order           integer
created_at      timestamp
```

### Storage buckets
- `verificaciones` — privado, documentos de identidad (DNI)
- `avatars` — público, fotos de perfil

---

## Funcionalidades del MVP

### Fase 1 — Base ✅
- [x] Autenticación (registro con first_name + last_name, login, logout)
- [x] Perfil de usuario (editar bio, zona, headline, teléfono, foto de perfil)
- [x] Ver perfil público de otros usuarios (sin datos de contacto)
- [x] Perfil estilo LinkedIn (secciones: experiencia, educación, certificados, proyectos, cursos)

### Fase 2 — Core ✅
- [x] Publicar post (oferta o requerimiento) con todos los campos
- [x] Feed de Ofertas con filtros (búsqueda, categoría, modalidad)
- [x] Feed de Requerimientos con filtros
- [x] Ver detalle de un post con tarjeta del autor
- [x] Panel hub (página principal con tabs Ofertas / Requerimientos)

### Fase 3 — Interacción ✅
- [x] Sistema de mensajería interna (Supabase Realtime)
- [x] Historial de trabajos (posts completados por usuario)
- [x] Sistema de ratings y reviews (post-trabajo)
- [x] Sistema de postulaciones (postularse, aceptar/rechazar, desbloqueo de contacto)

### Fase 4 — Confianza ✅
- [x] Badge de verificación (subir DNI → revisión manual → badge en perfil)
- [x] Panel admin para revisar verificaciones (/admin/verificaciones)
- [x] Sección "Inmediato" destacada en el feed

### Infraestructura ✅
- [x] Deploy en Vercel (producción)
- [x] Landing page dark con dot grid
- [x] Header responsive con menú hamburguesa en mobile

### NO construir en MVP (V2+)
- Pagos / escrow con MercadoPago
- Recomendaciones por IA
- Verificación de competencias avanzada
- App móvil nativa
- Algoritmo de matching
- Sistema de notificaciones push

---

## Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   ← solo para el panel admin (bypasa RLS)
ADMIN_EMAIL=                 ← email del admin para acceder a /admin
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
- `phone` solo visible cuando una postulación está aceptada (ambas partes)

### Visibilidad de datos de usuarios
| Contexto | Qué mostrar |
|---|---|
| Perfil público (ajeno) | first_name, headline, bio, location, rating |
| Perfil propio | first_name + last_name, todos los campos |
| Post (tarjeta autor) | first_name, bio, location, rating |
| Postulación aceptada | + phone del otro |
| Admin | todo |

### Estilo
- Mobile-first (la mayoría de usuarios van a entrar desde el celular)
- Diseño limpio y simple — no sobre-diseñar
- Tailwind puro, sin CSS custom salvo que sea estrictamente necesario
- Paleta zinc (gris), sin colores llamativos

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
