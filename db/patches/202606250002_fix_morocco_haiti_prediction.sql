-- Corrige palpite Marrocos x Haiti (jogo 50): 0-2 -> 2-0 para Marrocos.
-- Usuario: 2471ebe8-dfa4-4800-a031-6638b39dbb35
-- Placar real: Marrocos 4 x 2 Haiti -> +7 pts (resultado correto)

update user_predictions
set
  predictions =
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              predictions,
              '{matches,50}',
              (predictions->'matches'->'50') || jsonb_build_object(
                'homeGoals', 2,
                'awayGoals', 0,
                'points', 7
              )
            ),
            '{summary,matchPoints}', to_jsonb((predictions->'summary'->>'matchPoints')::int + 7)
          ),
          '{summary,totalPoints}', to_jsonb((predictions->'summary'->>'totalPoints')::int + 7)
        ),
        '{summary,correctOutcomes}', to_jsonb((predictions->'summary'->>'correctOutcomes')::int + 1)
      ),
      '{summary,lastCalculatedAt}', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    ),
  total_points = total_points + 7,
  match_points = match_points + 7,
  correct_outcomes = correct_outcomes + 1,
  updated_at = now()
where user_id = '2471ebe8-dfa4-4800-a031-6638b39dbb35'
  and tournament_code = 'WC2026';
