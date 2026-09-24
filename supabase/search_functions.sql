-- ============================================================
-- BÚSQUEDA FULL TEXT — correr en Supabase SQL Editor
-- 2026-09-24
--
-- Requiere lo que ya está creado: columnas search_vector (config 'spanish')
-- en posts y users, extensiones pg_trgm + unaccent y la función normalize_text().
--
-- Cómo puntúa cada resultado:
--   1. Cada palabra buscada se evalúa por separado (OR, no AND). Así "profesora de
--      inglés" encuentra "Clases de inglés" aunque no diga "profesora".
--   2. Cada palabra que coincide suma puntos según su "rareza" (IDF): una palabra
--      que aparece en pocas publicaciones ("inglés") pesa más que una muy común
--      ("profesora"). Las publicaciones que coinciden con más palabras suman más.
--   3. También importa dónde coincide: título 1.0, descripción 0.4, categoría 0.2,
--      zona 0.1 (pesos A/B/C/D del search_vector). Así "Clases de inglés" le gana a
--      un post que solo menciona "inglés" de pasada en la descripción.
--   4. Si una palabra no coincide por full text (typo: "iglés"), se prueba similitud
--      trigram contra palabras enteras (strict_word_similarity), con menos peso.
--
-- Las funciones son SECURITY INVOKER (default): respetan RLS igual que un select normal.
-- Devuelven solo ids + puntaje; los datos se leen después con el cliente de Supabase,
-- eligiendo columnas públicas.
-- ============================================================

create or replace function public.buscar_posts(
  p_terminos         text[],
  p_tipo             text   default null,
  p_categoria        text   default null,
  p_modalidades      text[] default null,
  p_presencialidades text[] default null,
  p_limite           int    default 20
)
returns table (id uuid, puntaje real, total bigint)
language sql
stable
set search_path = public
as $$
  with
  -- Cada palabra → consulta con prefijo ("prof" encuentra "profesor").
  -- Las stopwords ("de", "para", "con") quedan sin lexemas y se descartan.
  terminos as (
    select to_tsquery('spanish', t.termino || ':*') as consulta,
           normalize_text(t.termino)                as normalizado
    from unnest(p_terminos) as t(termino)
    where numnode(to_tsquery('spanish', t.termino || ':*')) > 0
  ),
  candidatos as (
    select p.id, p.created_at, p.search_vector,
           normalize_text(p.title || ' ' || coalesce(p.description, '')) as texto
    from posts p
    where p.is_active
      and (p_tipo is null or p.type = p_tipo::post_type)   -- posts.type es enum
      and (p_categoria is null or p.category = p_categoria)
      and (p_modalidades is null or p.modality && p_modalidades)
      and (p_presencialidades is null or p.presencialidad = any(p_presencialidades))
  ),
  pesos as (
    select tr.consulta, tr.normalizado,
           ln(1 + (select count(*) from candidatos)::float
                / (1 + (select count(*) from candidatos c where c.search_vector @@ tr.consulta))) as rareza
    from terminos tr
  ),
  puntajes as (
    select c.id, c.created_at,
           sum(
             case
               -- Coincidencia full text: pesa según dónde está la palabra
               when c.search_vector @@ pe.consulta
                 then pe.rareza * case
                   when ts_filter(c.search_vector, '{a}') @@ pe.consulta then 1.0  -- título
                   when ts_filter(c.search_vector, '{b}') @@ pe.consulta then 0.4  -- descripción
                   when ts_filter(c.search_vector, '{c}') @@ pe.consulta then 0.2  -- categoría
                   else 0.1                                                        -- zona
                 end
               -- Fallback typo: solo palabras de 4+ letras para evitar ruido.
               -- strict_word_similarity compara contra palabras enteras (word_similarity
               -- también compara tramos que cruzan palabras y da falsos positivos).
               when length(pe.normalizado) >= 4
                    and strict_word_similarity(pe.normalizado, c.texto) >= 0.4
                 then pe.rareza * strict_word_similarity(pe.normalizado, c.texto) * 0.5
               else 0
             end
           ) as puntaje
    from candidatos c
    cross join pesos pe
    group by c.id, c.created_at
  )
  select id, puntaje::real, count(*) over () as total
  from puntajes
  where puntaje > 0
  order by puntaje desc, created_at desc
  limit least(greatest(p_limite, 1), 50);
$$;


create or replace function public.buscar_usuarios(
  p_terminos text[],
  p_limite   int default 20
)
returns table (id uuid, puntaje real, total bigint)
language sql
stable
set search_path = public
as $$
  with
  terminos as (
    select to_tsquery('spanish', t.termino || ':*') as consulta,
           normalize_text(t.termino)                as normalizado
    from unnest(p_terminos) as t(termino)
    where numnode(to_tsquery('spanish', t.termino || ':*')) > 0
  ),
  -- El fallback trigram mira solo nombre + titular (no last_name: es privado)
  candidatos as (
    select u.id, u.created_at, u.search_vector,
           normalize_text(coalesce(u.first_name, '') || ' ' || coalesce(u.headline, '')) as texto
    from users u
    where u.search_vector is not null
  ),
  pesos as (
    select tr.consulta, tr.normalizado,
           ln(1 + (select count(*) from candidatos)::float
                / (1 + (select count(*) from candidatos c where c.search_vector @@ tr.consulta))) as rareza
    from terminos tr
  ),
  puntajes as (
    select c.id, c.created_at,
           sum(
             case
               when c.search_vector @@ pe.consulta
                 then pe.rareza * case
                   when ts_filter(c.search_vector, '{a}') @@ pe.consulta then 1.0  -- nombre + titular
                   when ts_filter(c.search_vector, '{b}') @@ pe.consulta then 0.4  -- bio
                   else 0.2                                                        -- zona
                 end
               when length(pe.normalizado) >= 4
                    and strict_word_similarity(pe.normalizado, c.texto) >= 0.4
                 then pe.rareza * strict_word_similarity(pe.normalizado, c.texto) * 0.5
               else 0
             end
           ) as puntaje
    from candidatos c
    cross join pesos pe
    group by c.id, c.created_at
  )
  select id, puntaje::real, count(*) over () as total
  from puntajes
  where puntaje > 0
  order by puntaje desc, created_at desc
  limit least(greatest(p_limite, 1), 50);
$$;

grant execute on function public.buscar_posts(text[], text, text, text[], text[], int) to anon, authenticated;
grant execute on function public.buscar_usuarios(text[], int) to anon, authenticated;
