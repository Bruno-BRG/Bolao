insert into teams_cache (external_id, fifa_code, iso2, name, flag_url)
values
  ('BRA', 'BRA', 'br', 'Brasil', 'https://flagcdn.com/w80/br.png'),
  ('ARG', 'ARG', 'ar', 'Argentina', 'https://flagcdn.com/w80/ar.png'),
  ('FRA', 'FRA', 'fr', 'Franca', 'https://flagcdn.com/w80/fr.png'),
  ('GER', 'GER', 'de', 'Alemanha', 'https://flagcdn.com/w80/de.png'),
  ('ESP', 'ESP', 'es', 'Espanha', 'https://flagcdn.com/w80/es.png'),
  ('POR', 'POR', 'pt', 'Portugal', 'https://flagcdn.com/w80/pt.png'),
  ('ENG', 'ENG', 'gb-eng', 'Inglaterra', 'https://flagcdn.com/w80/gb-eng.png'),
  ('USA', 'USA', 'us', 'Estados Unidos', 'https://flagcdn.com/w80/us.png')
on conflict (external_id) do update set
  fifa_code = excluded.fifa_code,
  iso2 = excluded.iso2,
  name = excluded.name,
  flag_url = excluded.flag_url,
  updated_at = now();

insert into matches_cache (
  external_id,
  tournament_code,
  home_team_id,
  away_team_id,
  starts_at,
  stage,
  group_name,
  status
)
values
  ('wc2026-001', 'WC2026', 'BRA', 'GER', '2026-06-11T19:00:00Z', 'Grupos', 'Grupo A', 'SCHEDULED'),
  ('wc2026-002', 'WC2026', 'ARG', 'FRA', '2026-06-12T19:00:00Z', 'Grupos', 'Grupo B', 'SCHEDULED'),
  ('wc2026-003', 'WC2026', 'ESP', 'POR', '2026-06-13T19:00:00Z', 'Grupos', 'Grupo C', 'SCHEDULED'),
  ('wc2026-004', 'WC2026', 'ENG', 'USA', '2026-06-14T19:00:00Z', 'Grupos', 'Grupo D', 'SCHEDULED')
on conflict (external_id) do update set
  home_team_id = excluded.home_team_id,
  away_team_id = excluded.away_team_id,
  starts_at = excluded.starts_at,
  stage = excluded.stage,
  group_name = excluded.group_name,
  status = excluded.status,
  updated_at = now();
