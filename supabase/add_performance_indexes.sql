-- ============================================================
-- ÍNDICES DE PERFORMANCE — correr en Supabase SQL Editor
-- Auditoría 2026-08-02
-- ============================================================

-- FKs sin índice automático en Postgres/Supabase
create index if not exists profile_sections_user_id_idx  on public.profile_sections(user_id);
create index if not exists verifications_user_id_idx     on public.verifications(user_id);
create index if not exists ratings_from_user_id_idx      on public.ratings(from_user_id);
create index if not exists ratings_post_id_idx           on public.ratings(post_id);
create index if not exists messages_post_id_idx          on public.messages(post_id);

-- Ordenamiento del feed (created_at DESC es el orden por defecto de todos los feeds)
create index if not exists posts_created_at_idx on public.posts(created_at desc);

-- Conteo de mensajes no leídos (layout.tsx lo llama en cada page render)
create index if not exists messages_read_partial_idx on public.messages(read) where read = false;

-- Filtros frecuentes en applications
create index if not exists applications_status_idx               on public.applications(status);
create index if not exists applications_completed_at_partial_idx on public.applications(completed_at) where completed_at is not null;
