-- ============================================================
-- PUBLICACIONES FINALIZADAS — ya aplicado en Supabase (SQL Editor)
-- ============================================================
-- La política original ("Posts activos visibles para todos") solo deja leer posts activos.
-- Al finalizar una publicación (is_active = false) nadie podía abrirla, ni siquiera para
-- calificar el trabajo terminado. Esta política se suma a la anterior (las de SELECT se
-- combinan con OR): el dueño y quienes le enviaron una solicitud pueden seguir viéndola.
-- El resto del público no ve publicaciones finalizadas.

create policy "Dueño e interesados ven publicaciones finalizadas"
  on public.posts for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.applications a
      where a.post_id = posts.id and a.applicant_id = auth.uid()
    )
  );
