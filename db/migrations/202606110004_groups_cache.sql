create table if not exists groups_cache (
  tournament_code text not null references tournaments(code),
  group_name text not null,
  team_id text not null references teams_cache(external_id),
  position int not null default 0,
  mp int not null default 0,
  w int not null default 0,
  d int not null default 0,
  l int not null default 0,
  pts int not null default 0,
  gf int not null default 0,
  ga int not null default 0,
  gd int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (tournament_code, group_name, team_id)
);

create index if not exists idx_groups_tournament_group
  on groups_cache(tournament_code, group_name, position);
