-- ============================================================
-- REPORTES DE PROBLEMAS — correr en Supabase SQL Editor
-- ============================================================
-- Los usuarios solo pueden CREAR reportes propios y VER los suyos.
-- No pueden editarlos ni borrarlos (si no, podrían marcarlos "resuelto" ellos mismos).
-- El panel admin lee y cambia estados con la service role key (bypasa RLS),
-- igual que el resto de las vistas de /admin.

create table public.reportes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        text not null check (type in ('bug', 'sugerencia', 'otro')),
  description text not null check (char_length(description) between 20 and 2000),
  status      text not null default 'nuevo' check (status in ('nuevo', 'en_revision', 'resuelto')),
  created_at  timestamptz not null default now()
);

create index reportes_user_id_idx    on public.reportes(user_id);
create index reportes_status_idx     on public.reportes(status);
create index reportes_created_at_idx on public.reportes(created_at desc);

alter table public.reportes enable row level security;

create policy "Usuarios crean sus propios reportes"
  on public.reportes for insert
  with check (auth.uid() = user_id);

create policy "Usuarios ven sus propios reportes"
  on public.reportes for select
  using (auth.uid() = user_id);

grant select, insert on public.reportes to authenticated;

-- El panel admin (/admin y /admin/reportes) usa el service role para listar, contar y cambiar
-- el estado. En este proyecto las tablas nuevas no le dan permisos automáticos: sin esta línea
-- el admin recibe "permission denied for table reportes" (42501). El service role salta la RLS,
-- así que no hace falta una política, solo el permiso.
grant select, update on public.reportes to service_role;
