-- Baseline manual da Copa (IDs worldcup26.ir).
-- Adicione times, jogos finalizados e classificacao abaixo antes de rodar.
-- O sync da API faz upsert pelos mesmos external_id sem apagar linhas manuais.

-- ---------------------------------------------------------------------------
-- TIMES (external_id = id da API worldcup26)
-- Campos: external_id, fifa_code, iso2, name, flag_url
-- ---------------------------------------------------------------------------
insert into teams_cache (external_id, fifa_code, iso2, name, flag_url)
values
  ('1', 'MEX', 'mx', 'Mexico', 'https://flagcdn.com/w80/mx.png'),
  ('2', 'RSA', 'za', 'South Africa', 'https://flagcdn.com/w80/za.png')
on conflict (external_id) do update set
  fifa_code = excluded.fifa_code,
  iso2 = excluded.iso2,
  name = excluded.name,
  flag_url = excluded.flag_url,
  updated_at = now();

-- Copie o bloco acima para os demais times. Exemplo de jogo finalizado:
-- status = 'FINISHED', score_home/score_away preenchidos.

-- ---------------------------------------------------------------------------
-- JOGOS (external_id = id do jogo na API)
-- ---------------------------------------------------------------------------
insert into matches_cache (
  external_id,
  tournament_code,
  home_team_id,
  away_team_id,
  starts_at,
  stage,
  group_name,
  status,
  score_home,
  score_away
)
values (
  '1',
  'WC2026',
  '1',
  '2',
  '2026-06-11T19:00:00Z',
  'Grupos',
  'Grupo A',
  'SCHEDULED',
  null,
  null
)
on conflict (external_id) do update set
  home_team_id = excluded.home_team_id,
  away_team_id = excluded.away_team_id,
  starts_at = excluded.starts_at,
  stage = excluded.stage,
  group_name = excluded.group_name,
  status = excluded.status,
  score_home = excluded.score_home,
  score_away = excluded.score_away,
  updated_at = now();

-- Para jogo ja realizado, use status 'FINISHED' e placar:
-- ('1', 'WC2026', '1', '2', '2026-06-11T19:00:00Z', 'Grupos', 'Grupo A', 'FINISHED', 2, 1)

-- ---------------------------------------------------------------------------
-- CLASSIFICACAO (groups_cache)
-- Uma linha por time em cada grupo; position = ordem na tabela (1 = lider)
-- ---------------------------------------------------------------------------
insert into groups_cache (
  tournament_code,
  group_name,
  team_id,
  position,
  mp,
  w,
  d,
  l,
  pts,
  gf,
  ga,
  gd
)
values
  ('WC2026', 'A', '1', 1, 0, 0, 0, 0, 0, 0, 0, 0),
  ('WC2026', 'A', '2', 2, 0, 0, 0, 0, 0, 0, 0, 0)
on conflict (tournament_code, group_name, team_id) do update set
  position = excluded.position,
  mp = excluded.mp,
  w = excluded.w,
  d = excluded.d,
  l = excluded.l,
  pts = excluded.pts,
  gf = excluded.gf,
  ga = excluded.ga,
  gd = excluded.gd,
  updated_at = now();
