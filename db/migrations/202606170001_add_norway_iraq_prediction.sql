-- Palpite manual: Iraque 1 x 3 Noruega (jogo 18, WC2026).
-- Noruega e visitante (team 36); mandante Iraque (team 35).
-- Usuario: f2f0e908-8320-4817-b469-90c1d5f1efe3

update user_predictions
set
  predictions = jsonb_set(
    jsonb_set(
      jsonb_set(
        predictions,
        '{matches,18}',
        jsonb_build_object(
          'homeTeamId', '35',
          'awayTeamId', '36',
          'homeGoals', 1,
          'awayGoals', 3,
          'savedAt', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
          'locked', false,
          'points', null
        ),
        true
      ),
      '{updatedAt}',
      to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    ),
    '{summary,blanks}',
    to_jsonb(greatest(0, coalesce((predictions->'summary'->>'blanks')::int, blanks) - 1))
  ),
  blanks = greatest(0, blanks - 1),
  updated_at = now()
where user_id = 'f2f0e908-8320-4817-b469-90c1d5f1efe3'
  and tournament_code = 'WC2026'
  and not (predictions->'matches' ? '18');
