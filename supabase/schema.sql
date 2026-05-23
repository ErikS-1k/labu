-- ============================================================
-- LABU — Schema de base de datos
-- Ejecutar en: Supabase → SQL Editor → New query
-- ============================================================


-- ============================================================
-- TIPOS (enums)
-- ============================================================

create type post_type as enum ('oferta', 'requerimiento');
create type post_modality as enum ('inmediato', 'temporal', 'por_proyecto', 'permanente');
create type price_type as enum ('hora', 'dia', 'trabajo', 'mes', 'a_convenir');
create type verification_type as enum ('dni', 'matricula', 'portfolio');
create type verification_status as enum ('pendiente', 'verificado', 'rechazado');
create type application_status as enum ('pendiente', 'aceptado', 'rechazado');


-- ============================================================
-- TABLA: users
-- Extiende auth.users de Supabase con datos del perfil público.
-- phone y email son PRIVADOS — nunca exponerlos en queries públicas.
-- ============================================================

create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique,
  first_name   text,
  last_name    text,
  headline     text,
  avatar_url   text,
  bio          text,
  location     text,
  phone        text,        -- PRIVADO
  email        text,        -- PRIVADO
  rating_avg   numeric default 0,
  rating_count integer default 0,
  created_at   timestamp with time zone default now()
);


-- ============================================================
-- TABLA: posts
-- Ofertas (el usuario ofrece trabajo) y requerimientos (el usuario busca trabajo).
-- ============================================================

create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  type         post_type not null,
  title        text not null,
  description  text,
  category     text,
  modality     text[] not null,   -- múltiple para ofertas, único para requerimientos
  price        numeric,
  price_type   price_type,
  location     text,
  is_active    boolean default true,
  created_at   timestamp with time zone default now()
);


-- ============================================================
-- TABLA: messages
-- conversation_id agrupa los mensajes entre dos usuarios sobre un tema.
-- ============================================================

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  sender_id       uuid not null references public.users(id) on delete cascade,
  receiver_id     uuid not null references public.users(id) on delete cascade,
  post_id         uuid references public.posts(id) on delete set null,
  content         text not null,
  read            boolean default false,
  created_at      timestamp with time zone default now()
);


-- ============================================================
-- TABLA: ratings
-- Un usuario no puede calificarse a sí mismo (chequeado en RLS).
-- ============================================================

create table public.ratings (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.users(id) on delete cascade,
  to_user_id   uuid not null references public.users(id) on delete cascade,
  post_id      uuid not null references public.posts(id) on delete cascade,
  score        integer not null check (score >= 1 and score <= 5),
  comment      text,
  created_at   timestamp with time zone default now()
);


-- ============================================================
-- TABLA: verifications
-- ============================================================

create table public.verifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  type         verification_type not null,
  status       verification_status default 'pendiente',
  document_url text,
  created_at   timestamp with time zone default now()
);


-- ============================================================
-- TABLA: applications
-- Un oferente se postula a un requerimiento.
-- Un mismo oferente solo puede postularse una vez por requerimiento.
-- ============================================================

create table public.applications (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  applicant_id uuid not null references public.users(id) on delete cascade,
  message              text,
  status               application_status default 'pendiente',
  confirmed_by_client  boolean not null default false,  -- el dueño del requerimiento confirmó finalización
  confirmed_by_worker  boolean not null default false,  -- el trabajador aceptado confirmó finalización
  completed_at         timestamp with time zone,        -- se llena cuando ambos confirman
  created_at           timestamp with time zone default now(),
  unique(post_id, applicant_id)
);


-- ============================================================
-- ÍNDICES (mejoran la velocidad de las consultas más comunes)
-- ============================================================

create index posts_user_id_idx      on public.posts(user_id);
create index posts_type_idx         on public.posts(type);
create index posts_modality_idx     on public.posts(modality);
create index posts_category_idx     on public.posts(category);
create index posts_is_active_idx    on public.posts(is_active);
create index messages_conversation_id_idx on public.messages(conversation_id);
create index messages_sender_id_idx   on public.messages(sender_id);
create index messages_receiver_id_idx on public.messages(receiver_id);
create index ratings_to_user_id_idx        on public.ratings(to_user_id);
create index applications_post_id_idx      on public.applications(post_id);
create index applications_applicant_id_idx on public.applications(applicant_id);


-- ============================================================
-- TRIGGER: crear perfil automáticamente al registrarse
-- Cuando Supabase Auth crea un usuario, creamos su fila en public.users.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- TRIGGER: actualizar rating_avg y rating_count al recibir una calificación
-- ============================================================

create or replace function public.update_user_rating()
returns trigger
language plpgsql
as $$
begin
  update public.users
  set
    rating_avg   = (select round(avg(score)::numeric, 1) from public.ratings where to_user_id = new.to_user_id),
    rating_count = (select count(*) from public.ratings where to_user_id = new.to_user_id)
  where id = new.to_user_id;
  return new;
end;
$$;

create trigger on_rating_created
  after insert on public.ratings
  for each row execute procedure public.update_user_rating();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Controla quién puede leer/escribir cada fila.
-- ============================================================

alter table public.users         enable row level security;
alter table public.posts         enable row level security;
alter table public.messages      enable row level security;
alter table public.ratings       enable row level security;
alter table public.verifications enable row level security;
alter table public.applications  enable row level security;


-- -- users --
-- Cualquiera puede ver perfiles (la app filtra phone y email)
create policy "Perfiles visibles para todos"
  on public.users for select
  using (true);

-- Solo podés crear tu propio perfil
create policy "Solo creás tu propio perfil"
  on public.users for insert
  with check (auth.uid() = id);

-- Solo podés editar tu propio perfil
create policy "Solo editás tu propio perfil"
  on public.users for update
  using (auth.uid() = id);


-- -- posts --
-- Cualquiera puede ver posts activos
create policy "Posts activos visibles para todos"
  on public.posts for select
  using (is_active = true);

-- Solo podés crear posts como vos mismo
create policy "Solo creás tus propios posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

-- Solo podés editar tus propios posts
create policy "Solo editás tus propios posts"
  on public.posts for update
  using (auth.uid() = user_id);

-- Solo podés eliminar tus propios posts
create policy "Solo eliminás tus propios posts"
  on public.posts for delete
  using (auth.uid() = user_id);


-- -- messages --
-- Solo el emisor o receptor pueden ver los mensajes
create policy "Solo participantes ven los mensajes"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Solo podés enviar mensajes como vos mismo
create policy "Solo enviás como vos mismo"
  on public.messages for insert
  with check (auth.uid() = sender_id);


-- -- ratings --
-- Las calificaciones son públicas
create policy "Ratings visibles para todos"
  on public.ratings for select
  using (true);

-- Solo podés calificar como vos mismo y no podés calificarte a vos mismo
create policy "Solo calificás como vos mismo y a otros"
  on public.ratings for insert
  with check (auth.uid() = from_user_id and auth.uid() != to_user_id);


-- -- verifications --
-- El estado "verificado" es público (para mostrar el badge en el perfil).
-- Las verificaciones pendientes o rechazadas solo las ve el propio usuario.
create policy "Estado verificado es público"
  on public.verifications for select
  using (
    auth.uid() = user_id
    or status = 'verificado'
  );

-- Solo podés crear tus propias verificaciones
create policy "Solo creás tus propias verificaciones"
  on public.verifications for insert
  with check (auth.uid() = user_id);


-- -- applications --
-- Las aplicaciones completadas son públicas (historial visible en perfiles).
-- Las pendientes/aceptadas/rechazadas solo las ven el postulante y el dueño del post.
create policy "Postulante y dueño del post ven la postulación"
  on public.applications for select
  using (
    completed_at is not null
    or auth.uid() = applicant_id
    or auth.uid() = (select user_id from public.posts where id = post_id)
  );

-- Solo te postulás como vos mismo y no a tus propios posts
create policy "Solo te postulás como vos mismo y a posts ajenos"
  on public.applications for insert
  with check (
    auth.uid() = applicant_id
    and auth.uid() != (select user_id from public.posts where id = post_id)
  );

-- Solo el dueño del post puede aceptar o rechazar
create policy "Solo el dueño del post cambia el estado"
  on public.applications for update
  using (auth.uid() = (select user_id from public.posts where id = post_id));

-- El postulante puede retirar su propia postulación
create policy "Postulante puede retirar su postulación"
  on public.applications for delete
  using (auth.uid() = applicant_id);


-- ============================================================
-- GRANTS (necesarios para tablas creadas con SQL puro)
-- ============================================================

grant select, insert, update, delete on public.applications  to authenticated;
grant select                          on public.applications  to anon;
grant select                          on public.verifications to anon;


-- ============================================================
-- TABLA: profile_sections
-- Secciones de perfil estilo LinkedIn (experiencia, educación, etc.)
-- ============================================================

create table public.profile_sections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        text not null check (type in ('experiencia','educacion','certificado','proyecto','curso')),
  title       text not null,
  subtitle    text,
  description text,
  date_from   text,
  date_to     text,
  url         text,
  "order"     integer not null default 0,
  created_at  timestamptz default now()
);

alter table public.profile_sections enable row level security;

create policy "Todos ven secciones públicas"
  on public.profile_sections for select
  using (true);

create policy "Usuario edita sus propias secciones"
  on public.profile_sections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.profile_sections to authenticated;
grant select                          on public.profile_sections to anon;


-- ============================================================
-- TABLA: notifications
-- Notificaciones internas del usuario (postulaciones, ratings).
-- INSERT usa createServiceClient() porque el actor no es el destinatario.
-- ============================================================

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null check (type in ('nueva_postulacion','postulacion_aceptada','postulacion_rechazada','nuevo_rating')),
  message    text not null,
  link       text not null,
  read       boolean not null default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Solo ves tus propias notificaciones"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Solo marcás como leídas las tuyas"
  on public.notifications for update
  using (auth.uid() = user_id);

create index notifications_user_id_read_idx on public.notifications(user_id, read);

grant select, update on public.notifications to authenticated;
