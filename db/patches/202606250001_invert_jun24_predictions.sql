-- Inverte homeGoals/awayGoals nos palpites de 24/06 (jogos 49, 50, 53, 54).
-- Usuario: 548cd8c7-a9f1-4e85-a6f8-fe78945a7587
-- Escócia x Brasil (49): 3-2 -> 2-3 (+7)
-- Marrocos x Haiti (50): 1-2 -> 2-1 (+7)
-- Bósnia x Catar (53): 1-2 -> 2-1 (+7)
-- Suíça x Canadá (54): 1-1 -> 1-1 (0)

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
                    '{matches,49}',
                    (predictions->'matches'->'49') || jsonb_build_object(
                      'homeGoals', (predictions->'matches'->'49'->>'awayGoals')::int,
                      'awayGoals', (predictions->'matches'->'49'->>'homeGoals')::int,
                      'points', 7
                    )
                  ),
                  '{matches,50}',
                  (predictions->'matches'->'50') || jsonb_build_object(
                    'homeGoals', (predictions->'matches'->'50'->>'awayGoals')::int,
                    'awayGoals', (predictions->'matches'->'50'->>'homeGoals')::int,
                    'points', 7
                  )
                ),
                '{matches,53}',
                (predictions->'matches'->'53') || jsonb_build_object(
                  'homeGoals', (predictions->'matches'->'53'->>'awayGoals')::int,
                  'awayGoals', (predictions->'matches'->'53'->>'homeGoals')::int,
                  'points', 7
                )
              ),
              '{matches,54}',
              (predictions->'matches'->'54') || jsonb_build_object(
                'homeGoals', (predictions->'matches'->'54'->>'awayGoals')::int,
                'awayGoals', (predictions->'matches'->'54'->>'homeGoals')::int,
                'points', 0
              )
            ),
            '{summary,matchPoints}', to_jsonb((predictions->'summary'->>'matchPoints')::int + 21)
          ),
          '{summary,totalPoints}', to_jsonb((predictions->'summary'->>'totalPoints')::int + 21)
        ),
        '{summary,correctOutcomes}', to_jsonb((predictions->'summary'->>'correctOutcomes')::int + 3)
      ),
      '{summary,lastCalculatedAt}', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    ),
  total_points = total_points + 21,
  match_points = match_points + 21,
  correct_outcomes = correct_outcomes + 3,
  updated_at = now()
where user_id = '548cd8c7-a9f1-4e85-a6f8-fe78945a7587'
  and tournament_code = 'WC2026';
