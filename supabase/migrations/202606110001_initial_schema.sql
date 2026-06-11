create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_token_hash text not null unique,
  user_agent text,
  ip_hash text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists tournaments (
  code text primary key,
  name text not null,
  year int not null,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists teams_cache (
  external_id text primary key,
  fifa_code text,
  iso2 text,
  name text not null,
  flag_url text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists matches_cache (
  external_id text primary key,
  tournament_code text not null references tournaments(code),
  home_team_id text references teams_cache(external_id),
  away_team_id text references teams_cache(external_id),
  starts_at timestamptz not null,
  stage text,
  group_name text,
  status text not null default 'SCHEDULED',
  score_home int,
  score_away int,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists user_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  tournament_code text not null references tournaments(code),
  predictions jsonb not null default '{
    "version": 1,
    "tournamentCode": "WC2026",
    "updatedAt": null,
    "matches": {},
    "topFour": null,
    "summary": {
      "totalPoints": 0,
      "matchPoints": 0,
      "topFourPoints": 0,
      "exactScores": 0,
      "correctOutcomes": 0,
      "closeScores": 0,
      "blanks": 0,
      "lastCalculatedAt": null
    }
  }'::jsonb,
  total_points int not null default 0,
  match_points int not null default 0,
  top_four_points int not null default 0,
  exact_scores int not null default 0,
  correct_outcomes int not null default 0,
  close_scores int not null default 0,
  blanks int not null default 0,
  updated_at timestamptz not null default now(),
  locked_at timestamptz,
  unique(user_id, tournament_code)
);

create table if not exists ranking_snapshots (
  id uuid primary key default gen_random_uuid(),
  tournament_code text not null references tournaments(code),
  generated_at timestamptz not null default now(),
  snapshot jsonb not null
);

create table if not exists sync_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  status text not null,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_expires_at on sessions(expires_at);
create index if not exists idx_predictions_user_tournament on user_predictions(user_id, tournament_code);
create index if not exists idx_predictions_jsonb on user_predictions using gin(predictions);
create index if not exists idx_matches_tournament_start on matches_cache(tournament_code, starts_at);
create index if not exists idx_matches_status on matches_cache(status);
create index if not exists idx_ranking_generated_at on ranking_snapshots(tournament_code, generated_at desc);

insert into tournaments (code, name, year, starts_at, ends_at)
values ('WC2026', 'Copa do Mundo 2026', 2026, '2026-06-11T00:00:00Z', '2026-07-19T23:59:59Z')
on conflict (code) do update set
  name = excluded.name,
  year = excluded.year,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at;
