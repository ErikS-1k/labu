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
El perfil público muestra información general. El nombre completo y contacto se desbloquean solo cuando se inicia una contratación formal dentro de la plataforma (modelo Airbnb). Esto se implementa completamente en V2 cuando haya pagos.

---

## Stack técnico
- **Framework:** Next.js 14 con App Router
- **Lenguaje:** TypeScript (siempre)
- **Base de datos + Auth + Realtime:** Supabase
- **Estilos:** Tailwind CSS
- **Deploy:** Vercel
- **Pagos (V2):** MercadoPago API

---

## Estructura del proyecto
```
/app              → páginas (App Router)
/components       → componentes reutilizables
/lib              → utilidades, cliente de supabase, helpers
/types            → tipos TypeScript
/public           → assets estáticos
CLAUDE.md         → este archivo
```

---

## Base de datos (Supabase)

### Tabla: users
```
id              uuid (primary key, auth.users)
username        text (único)
full_name       text
avatar_url      text
bio             text
location        text (zona general, ej: "Palermo, CABA")
phone           text (PRIVADO — solo visible post-contratación)
email           text (PRIVADO — solo visible post-contratación)
rating_avg      numeric (calculado)
rating_count    integer
created_at      timestamp
```

### Tabla: posts
```
id              uuid (primary key)
user_id         uuid (foreign key → users)
type            enum: 'oferta' | 'requerimiento'
title           text
description     text
category        text (plomería, electricidad, programación, etc.)
modality        enum: 'inmediato' | 'temporal' | 'permanente'
price           numeric
price_type      enum: 'hora' | 'dia' | 'trabajo' | 'mes' | 'a_convenir'
location        text
is_active       boolean
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
status          enum: 'pendiente' | 'aceptado' | 'rechazado'
created_at      timestamp
```

### Tabla: verifications
```
id              uuid (primary key)
user_id         uuid (foreign key → users)
type            enum: 'dni' | 'matricula' | 'portfolio'
status          enum: 'pendiente' | 'verificado' | 'rechazado'
created_at      timestamp
```

---

## Funcionalidades del MVP (construir en este orden)

### Fase 1 — Base
- [ ] Autenticación (registro, login, logout) con Supabase Auth
- [ ] Perfil de usuario (crear, editar, ver perfil propio)
- [ ] Ver perfil público de otros usuarios (sin datos de contacto)

### Fase 2 — Core
- [ ] Publicar post (oferta o requerimiento) con todos los campos
- [ ] Feed de Ofertas con filtros (categoría, modalidad, zona)
- [ ] Feed de Requerimientos con filtros
- [ ] Ver detalle de un post

### Fase 3 — Interacción
- [ ] Sistema de mensajería interna (Supabase Realtime)
- [ ] Historial de trabajos (posts completados por usuario)
- [ ] Sistema de ratings y reviews (post-trabajo)

### Fase 4 — Confianza
- [ ] Badge de verificación básica (subir DNI, revisión manual)
- [ ] Sección "Inmediato" destacada en el feed

### NO construir en MVP (V2+)
- Pagos / escrow con MercadoPago
- Recomendaciones por IA
- Verificación de competencias avanzada
- App móvil nativa
- Algoritmo de matching
- Sistema de notificaciones push

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
- No exponer datos privados (phone, email) en queries públicas

### Estilo
- Mobile-first (la mayoría de usuarios van a entrar desde el celular)
- Diseño limpio y simple — no sobre-diseñar
- Tailwind puro, sin CSS custom salvo que sea estrictamente necesario

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

---

## Estado actual del proyecto
- [hecho] Proyecto creado
- [hecho] CLAUDE.md configurado
- [hecho] Supabase configurado
- [ ] Vercel configurado
- [en proceso] Primera página funcional