-- Normaliza palpites por jogo em tabela relacional.
-- O JSONB em user_predictions.predictions permanece como backup (nao apagamos).

create table if not exists match_predictions (
  user_id uuid not null references users(id) on delete cascade,
  tournament_code text not null references tournaments(code),
  match_external_id text not null references matches_cache(external_id),
  home_team_id text,
  away_team_id text,
  home_goals int not null,
  away_goals int not null,
  predicted_winner_team_id text,
  predicted_decided_by text,
  saved_at timestamptz not null,
  locked boolean not null default false,
  points int,
  points_breakdown jsonb,
  primary key (user_id, tournament_code, match_external_id)
);

alter table user_predictions
  add column if not exists bracket jsonb,
  add column if not exists top_four jsonb,
  add column if not exists knockout_points int not null default 0,
  add column if not exists bracket_points int not null default 0;

create index if not exists idx_match_predictions_user
  on match_predictions(user_id, tournament_code);

create index if not exists idx_match_predictions_tournament_match
  on match_predictions(tournament_code, match_external_id);

create index if not exists idx_predictions_ranking
  on user_predictions(
    tournament_code,
    total_points desc,
    exact_scores desc,
    correct_outcomes desc,
    blanks asc
  );

-- Extrai bracket/top4 para colunas dedicadas (menores que o documento inteiro).
update user_predictions
set
  bracket = coalesce(bracket, predictions->'bracket'),
  top_four = coalesce(top_four, predictions->'topFour'),
  knockout_points = coalesce(
    knockout_points,
    coalesce((predictions->'summary'->>'knockoutPoints')::int, 0)
  ),
  bracket_points = coalesce(
    bracket_points,
    coalesce((predictions->'summary'->>'bracketPoints')::int, 0)
  )
where tournament_code = 'WC2026';

-- Backfill: um registro por jogo salvo no JSON legado.
insert into match_predictions (
  user_id,
  tournament_code,
  match_external_id,
  home_team_id,
  away_team_id,
  home_goals,
  away_goals,
  predicted_winner_team_id,
  predicted_decided_by,
  saved_at,
  locked,
  points,
  points_breakdown
)
select
  up.user_id,
  up.tournament_code,
  m.key as match_external_id,
  nullif(m.value->>'homeTeamId', '') as home_team_id,
  nullif(m.value->>'awayTeamId', '') as away_team_id,
  coalesce((m.value->>'homeGoals')::int, 0) as home_goals,
  coalesce((m.value->>'awayGoals')::int, 0) as away_goals,
  nullif(m.value->>'predictedWinnerTeamId', '') as predicted_winner_team_id,
  nullif(m.value->>'predictedDecidedBy', '') as predicted_decided_by,
  coalesce(
    nullif(m.value->>'savedAt', '')::timestamptz,
    up.updated_at
  ) as saved_at,
  coalesce((m.value->>'locked')::boolean, false) as locked,
  (m.value->>'points')::int as points,
  m.value->'pointsBreakdown' as points_breakdown
from user_predictions up
cross join lateral jsonb_each(coalesce(up.predictions->'matches', '{}'::jsonb)) as m(key, value)
where up.tournament_code = 'WC2026'
on conflict (user_id, tournament_code, match_external_id) do nothing;
