-- Palpites ausentes nos jogos 51 e 52 (nao salvos no app).
-- Usuario: b343c2fb-ed81-4076-a43a-5164ad250098
-- 51: Africa do Sul 1 x 2 Coreia do Sul (0 pts, real 1-0)
-- 52: Tchequia 1 x 2 Mexico (7 pts, real 0-3)

update user_predictions
set
  predictions =
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    predictions,
                    '{matches,51}',
                    jsonb_build_object(
                      'homeTeamId', '2',
                      'awayTeamId', '3',
                      'homeGoals', 1,
                      'awayGoals', 2,
                      'savedAt', '2026-06-25T00:30:00.000Z',
                      'locked', true,
                      'points', 0
                    ),
                    true
                  ),
                  '{matches,52}',
                  jsonb_build_object(
                    'homeTeamId', '4',
                    'awayTeamId', '1',
                    'homeGoals', 1,
                    'awayGoals', 2,
                    'savedAt', '2026-06-25T00:30:00.000Z',
                    'locked', true,
                    'points', 7
                  ),
                  true
                ),
                '{summary,matchPoints}', to_jsonb((predictions->'summary'->>'matchPoints')::int + 7)
              ),
              '{summary,totalPoints}', to_jsonb((predictions->'summary'->>'totalPoints')::int + 7)
            ),
            '{summary,correctOutcomes}', to_jsonb((predictions->'summary'->>'correctOutcomes')::int + 1)
          ),
          '{summary,blanks}', to_jsonb((predictions->'summary'->>'blanks')::int - 2)
        ),
        '{summary,lastCalculatedAt}', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
      ),
      '{updatedAt}', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    ),
  total_points = total_points + 7,
  match_points = match_points + 7,
  correct_outcomes = correct_outcomes + 1,
  blanks = blanks - 2,
  updated_at = now()
where user_id = 'b343c2fb-ed81-4076-a43a-5164ad250098'
  and tournament_code = 'WC2026'
  and not (predictions->'matches' ? '51')
  and not (predictions->'matches' ? '52');
