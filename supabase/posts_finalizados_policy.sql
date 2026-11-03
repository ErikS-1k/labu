-- ============================================================
-- PUBLICACIONES FINALIZADAS — ya aplicado en Supabase (SQL Editor), versión corregida
-- ============================================================
-- La política original ("Posts activos visibles para todos") solo deja leer posts activos.
-- Al finalizar una publicación (is_active = false) nadie podía abrirla, ni siquiera para
-- calificar el trabajo terminado. Esta política se suma a la anterior (las de SELECT se
-- combinan con OR): el dueño y quienes le enviaron una solicitud pueden seguir viéndola.
--
-- ⚠️ NO consultar public.applications directamente dentro de la política:
-- la RLS de applications ("Postulante y dueño del post ven la postulación") consulta posts,
-- y eso forma un ciclo → error 42P17 "infinite recursion detected in policy for relation posts"
-- que rompe TODAS las lecturas de posts y applications para usuarios reales (pasó el
-- 2026-11-02). La función security definer lee applications sin pasar por su RLS.

create or replace function public.es_interesado(p_post_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.applications
    where post_id = p_post_id and applicant_id = auth.uid()
  )
$$;

create policy "Dueño e interesados ven publicaciones finalizadas"
  on public.posts for select
  using (auth.uid() = user_id or public.es_interesado(id));
