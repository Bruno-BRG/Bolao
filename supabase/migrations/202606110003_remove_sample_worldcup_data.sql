delete from matches_cache
where tournament_code = 'WC2026'
  and external_id like 'wc2026-%';

delete from teams_cache
where external_id in ('BRA', 'ARG', 'FRA', 'GER', 'ESP', 'POR', 'ENG', 'USA')
  and not exists (
    select 1
    from matches_cache m
    where m.home_team_id = teams_cache.external_id
       or m.away_team_id = teams_cache.external_id
  );
