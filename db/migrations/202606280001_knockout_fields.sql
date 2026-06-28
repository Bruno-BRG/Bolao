-- Mata-mata: resultado oficial do confronto (alem do placar)
ALTER TABLE matches_cache
  ADD COLUMN IF NOT EXISTS winner_team_id text REFERENCES teams_cache(external_id),
  ADD COLUMN IF NOT EXISTS decided_by text;

CREATE INDEX IF NOT EXISTS idx_matches_knockout_stage
  ON matches_cache(tournament_code, stage)
  WHERE stage IS NOT NULL AND stage <> 'Grupos';
