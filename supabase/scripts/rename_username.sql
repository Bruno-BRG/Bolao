-- Renomeia username em todo lugar que guarda o nome copiado (ranking).
-- Palpites, sessoes e login usam user_id (uuid) — nao precisam mudar.
--
-- Uso: edite old_username / new_username abaixo e rode no SQL Editor do Supabase.

begin;

with params as (
  select
    'bruno_rocha'::text as old_username,
    'bruno'::text as new_username,
    'WC2026'::text as tournament_code
),
target_user as (
  select u.id, u.username
  from users u
  cross join params p
  where u.username in (p.old_username, p.new_username)
  order by case when u.username = p.new_username then 0 else 1 end
  limit 1
),
updated_users as (
  update users u
  set
    username = p.new_username,
    updated_at = now()
  from params p, target_user t
  where u.id = t.id
    and u.username = p.old_username
  returning u.id, u.username
),
updated_snapshots as (
  update ranking_snapshots rs
  set snapshot = rebuilt.snapshot
  from (
    select
      rs_inner.id,
      jsonb_agg(
        case
          when elem->>'username' = p.old_username
            or elem->>'userId' = t.id::text
          then jsonb_set(elem, '{username}', to_jsonb(p.new_username), false)
          else elem
        end
        order by ord
      ) as snapshot
    from ranking_snapshots rs_inner
    cross join params p
    cross join target_user t
    cross join lateral jsonb_array_elements(rs_inner.snapshot) with ordinality as arr(elem, ord)
    where rs_inner.tournament_code = p.tournament_code
      and exists (
        select 1
        from jsonb_array_elements(rs_inner.snapshot) as check_elem(elem)
        where check_elem.elem->>'username' = p.old_username
           or check_elem.elem->>'userId' = t.id::text
      )
    group by rs_inner.id
  ) rebuilt
  where rs.id = rebuilt.id
  returning rs.id
)
select
  (select id from target_user) as user_id,
  (select username from target_user) as username_atual,
  (select count(*) from updated_users) as users_atualizados,
  (select count(*) from updated_snapshots) as snapshots_atualizados;

commit;

-- Conferencia (rode depois se quiser):
-- select id, username from users where username in ('bruno', 'bruno_rocha');
-- select generated_at, elem->>'username', elem->>'userId'
-- from ranking_snapshots, jsonb_array_elements(snapshot) elem
-- where tournament_code = 'WC2026'
-- order by generated_at desc
-- limit 20;
