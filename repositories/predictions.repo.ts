import pg from "pg";
import { TOURNAMENT_CODE } from "@/lib/constants";
import { getPool, query } from "@/lib/db";
import { createEmptyPredictionDocument, normalizePredictionDocument } from "@/services/prediction-document";
import type { BracketPrediction, MatchPrediction, PredictionDocument, TopFourPrediction } from "@/types/domain";

type PredictionHeaderRow = {
  id: string;
  user_id: string;
  bracket: BracketPrediction | null;
  top_four: TopFourPrediction | null;
  total_points: number;
  match_points: number;
  knockout_points: number;
  top_four_points: number;
  bracket_points: number;
  exact_scores: number;
  correct_outcomes: number;
  close_scores: number;
  blanks: number;
  updated_at: string;
};

type MatchPredictionRow = {
  match_external_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_goals: number;
  away_goals: number;
  predicted_winner_team_id: string | null;
  predicted_decided_by: string | null;
  saved_at: string;
  locked: boolean;
  points: number | null;
  points_breakdown: MatchPrediction["pointsBreakdown"] | null;
};

export type PredictionSummaryRow = {
  user_id: string;
  total_points: number;
  match_points: number;
  knockout_points: number;
  top_four_points: number;
  bracket_points: number;
  exact_scores: number;
  correct_outcomes: number;
  close_scores: number;
  blanks: number;
  updated_at: string;
  saved_matches: number;
  has_bracket: boolean;
  users: { username: string; created_at: string } | null;
};

type PredictionRow = PredictionHeaderRow & {
  predictions: PredictionDocument;
};

function rowToMatchPrediction(row: MatchPredictionRow): MatchPrediction {
  return {
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
    predictedWinnerTeamId: row.predicted_winner_team_id,
    predictedDecidedBy: row.predicted_decided_by as MatchPrediction["predictedDecidedBy"],
    savedAt: row.saved_at,
    locked: row.locked,
    points: row.points,
    pointsBreakdown: row.points_breakdown ?? null
  };
}

function assemblePredictionDocument(
  header: PredictionHeaderRow | null,
  matchRows: MatchPredictionRow[]
): PredictionDocument {
  const fallback = createEmptyPredictionDocument();
  if (!header) return fallback;

  const matches = Object.fromEntries(
    matchRows.map((row) => [row.match_external_id, rowToMatchPrediction(row)])
  );

  return normalizePredictionDocument({
    version: 2,
    tournamentCode: TOURNAMENT_CODE,
    updatedAt: header.updated_at,
    matches,
    topFour: header.top_four,
    bracket: header.bracket,
    summary: {
      totalPoints: header.total_points,
      matchPoints: header.match_points,
      knockoutPoints: header.knockout_points,
      topFourPoints: header.top_four_points,
      bracketPoints: header.bracket_points,
      exactScores: header.exact_scores,
      correctOutcomes: header.correct_outcomes,
      closeScores: header.close_scores,
      blanks: header.blanks,
      lastCalculatedAt: null
    }
  });
}

type DbExecutor = {
  query: <T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[]
  ) => Promise<pg.QueryResult<T>>;
};

function bindQuery(client?: DbExecutor) {
  if (!client) return query;
  return <T extends pg.QueryResultRow>(text: string, params?: unknown[]) =>
    client.query<T>(text, params);
}

async function loadMatchPredictionRows(
  userId: string,
  client?: DbExecutor
): Promise<MatchPredictionRow[]> {
  const run = bindQuery(client);
  const { rows } = await run<MatchPredictionRow>(
    `SELECT match_external_id, home_team_id, away_team_id, home_goals, away_goals,
            predicted_winner_team_id, predicted_decided_by, saved_at, locked,
            points, points_breakdown
     FROM match_predictions
     WHERE user_id = $1 AND tournament_code = $2`,
    [userId, TOURNAMENT_CODE]
  );
  return rows;
}

async function loadPredictionHeader(
  userId: string,
  client?: DbExecutor
): Promise<PredictionHeaderRow | null> {
  const run = bindQuery(client);
  const { rows } = await run<PredictionHeaderRow>(
    `SELECT id, user_id, bracket, top_four, total_points, match_points, knockout_points,
            top_four_points, bracket_points, exact_scores, correct_outcomes, close_scores,
            blanks, updated_at
     FROM user_predictions
     WHERE user_id = $1 AND tournament_code = $2
     LIMIT 1`,
    [userId, TOURNAMENT_CODE]
  );
  return rows[0] ?? null;
}

async function loadPredictionDocumentWithClient(
  userId: string,
  client: DbExecutor
): Promise<PredictionDocument> {
  const [header, matchRows] = await Promise.all([
    loadPredictionHeader(userId, client),
    loadMatchPredictionRows(userId, client)
  ]);

  if (!header && matchRows.length === 0) {
    const { rows } = await client.query<{ predictions: PredictionDocument }>(
      `SELECT predictions
       FROM user_predictions
       WHERE user_id = $1 AND tournament_code = $2
       LIMIT 1`,
      [userId, TOURNAMENT_CODE]
    );
    return normalizePredictionDocument((rows[0] as { predictions?: PredictionDocument })?.predictions);
  }

  let document = assemblePredictionDocument(header, matchRows);
  const needsLegacyFallback =
    Object.keys(document.matches).length === 0 ||
    (!document.bracket && !document.topFour);

  if (!needsLegacyFallback) return document;

  const { rows } = await client.query<{ predictions: PredictionDocument }>(
    `SELECT predictions
     FROM user_predictions
     WHERE user_id = $1 AND tournament_code = $2
     LIMIT 1`,
    [userId, TOURNAMENT_CODE]
  );
  const legacy = normalizePredictionDocument((rows[0] as { predictions?: PredictionDocument })?.predictions);

  if (Object.keys(document.matches).length === 0 && Object.keys(legacy.matches).length > 0) {
    document = { ...document, matches: legacy.matches };
  }
  if (!document.bracket && legacy.bracket) {
    document = { ...document, bracket: legacy.bracket };
  }
  if (!document.topFour && legacy.topFour) {
    document = { ...document, topFour: legacy.topFour };
  }

  return document;
}

async function loadPredictionDocument(userId: string): Promise<PredictionDocument> {
  return loadPredictionDocumentWithClient(userId, { query });
}

function predictionSummaryParams(document: PredictionDocument) {
  return [
    document,
    document.bracket ?? null,
    document.topFour ?? null,
    document.summary.totalPoints,
    document.summary.matchPoints,
    document.summary.knockoutPoints,
    document.summary.topFourPoints,
    document.summary.bracketPoints,
    document.summary.exactScores,
    document.summary.correctOutcomes,
    document.summary.closeScores,
    document.summary.blanks
  ];
}

function matchPredictionFingerprint(prediction: MatchPrediction) {
  return [
    prediction.homeGoals,
    prediction.awayGoals,
    prediction.predictedWinnerTeamId ?? "",
    prediction.predictedDecidedBy ?? "",
    prediction.locked,
    prediction.points ?? "",
    prediction.savedAt
  ].join("|");
}

function findTouchedMatchIds(
  before: Map<string, string>,
  after: Record<string, MatchPrediction>
) {
  const touched = new Set<string>();

  for (const [matchId, prediction] of Object.entries(after)) {
    const fingerprint = matchPredictionFingerprint(prediction);
    if (before.get(matchId) !== fingerprint) {
      touched.add(matchId);
    }
  }

  return [...touched];
}

async function persistMatchPredictions(
  userId: string,
  matches: Record<string, MatchPrediction>,
  client: DbExecutor,
  onlyMatchIds?: string[]
) {
  const entries = onlyMatchIds
    ? onlyMatchIds
        .map((matchId) => [matchId, matches[matchId]] as const)
        .filter((entry): entry is [string, MatchPrediction] => Boolean(entry[1]))
    : Object.entries(matches);
  for (const [matchId, prediction] of entries) {
    await client.query(
      `INSERT INTO match_predictions (
         user_id, tournament_code, match_external_id, home_team_id, away_team_id,
         home_goals, away_goals, predicted_winner_team_id, predicted_decided_by,
         saved_at, locked, points, points_breakdown
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (user_id, tournament_code, match_external_id) DO UPDATE SET
         home_team_id = EXCLUDED.home_team_id,
         away_team_id = EXCLUDED.away_team_id,
         home_goals = EXCLUDED.home_goals,
         away_goals = EXCLUDED.away_goals,
         predicted_winner_team_id = EXCLUDED.predicted_winner_team_id,
         predicted_decided_by = EXCLUDED.predicted_decided_by,
         saved_at = EXCLUDED.saved_at,
         locked = EXCLUDED.locked,
         points = EXCLUDED.points,
         points_breakdown = EXCLUDED.points_breakdown`,
      [
        userId,
        TOURNAMENT_CODE,
        matchId,
        prediction.homeTeamId,
        prediction.awayTeamId,
        prediction.homeGoals,
        prediction.awayGoals,
        prediction.predictedWinnerTeamId ?? null,
        prediction.predictedDecidedBy ?? null,
        prediction.savedAt,
        prediction.locked,
        prediction.points,
        prediction.pointsBreakdown ?? null
      ]
    );
  }
}

async function persistPredictionDocument(
  userId: string,
  document: PredictionDocument,
  client: DbExecutor,
  onlyMatchIds?: string[]
) {
  const params = predictionSummaryParams(document);
  await client.query(
    `INSERT INTO user_predictions (
       user_id, tournament_code, predictions, bracket, top_four, total_points, match_points,
       knockout_points, top_four_points, bracket_points, exact_scores, correct_outcomes,
       close_scores, blanks, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
     ON CONFLICT (user_id, tournament_code) DO UPDATE SET
       predictions = EXCLUDED.predictions,
       bracket = EXCLUDED.bracket,
       top_four = EXCLUDED.top_four,
       total_points = EXCLUDED.total_points,
       match_points = EXCLUDED.match_points,
       knockout_points = EXCLUDED.knockout_points,
       top_four_points = EXCLUDED.top_four_points,
       bracket_points = EXCLUDED.bracket_points,
       exact_scores = EXCLUDED.exact_scores,
       correct_outcomes = EXCLUDED.correct_outcomes,
       close_scores = EXCLUDED.close_scores,
       blanks = EXCLUDED.blanks,
       updated_at = NOW()`,
    [userId, TOURNAMENT_CODE, ...params]
  );

  if (onlyMatchIds && onlyMatchIds.length === 0) return;

  await persistMatchPredictions(userId, document.matches, client, onlyMatchIds);
}

export async function getOrCreatePredictionDocument(userId: string) {
  const header = await loadPredictionHeader(userId);
  if (header) {
    const document = await loadPredictionDocument(userId);
    return {
      ...header,
      predictions: document
    } satisfies PredictionRow;
  }

  const empty = createEmptyPredictionDocument();
  const { rows: created } = await query<PredictionHeaderRow>(
    `INSERT INTO user_predictions (user_id, tournament_code, predictions)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, bracket, top_four, total_points, match_points, knockout_points,
               top_four_points, bracket_points, exact_scores, correct_outcomes, close_scores,
               blanks, updated_at`,
    [userId, TOURNAMENT_CODE, empty]
  );

  return {
    ...created[0],
    predictions: empty
  } satisfies PredictionRow;
}

/**
 * Loads the user's prediction document under row lock, applies `mutator`, and
 * persists once. Prevents lost updates when several palpites save in parallel.
 */
export async function mutatePredictionDocument(
  userId: string,
  mutator: (document: PredictionDocument) => boolean
): Promise<{ document: PredictionDocument; changed: boolean }> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const empty = createEmptyPredictionDocument();
    await client.query(
      `INSERT INTO user_predictions (user_id, tournament_code, predictions)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, tournament_code) DO NOTHING`,
      [userId, TOURNAMENT_CODE, empty]
    );

    await client.query(
      `SELECT id
       FROM user_predictions
       WHERE user_id = $1 AND tournament_code = $2
       FOR UPDATE`,
      [userId, TOURNAMENT_CODE]
    );

    const document = await loadPredictionDocumentWithClient(userId, client);
    const before = new Map(
      Object.entries(document.matches).map(([matchId, prediction]) => [
        matchId,
        matchPredictionFingerprint(prediction)
      ])
    );
    const changed = mutator(document);

    if (changed) {
      const touchedMatchIds = findTouchedMatchIds(before, document.matches);
      await persistPredictionDocument(userId, document, client, touchedMatchIds);
    }

    await client.query("COMMIT");
    return { document, changed };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updatePredictionDocument(
  userId: string,
  document: PredictionDocument
) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await persistPredictionDocument(userId, document, client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listPredictionSummaries(): Promise<PredictionSummaryRow[]> {
  const { rows } = await query<PredictionSummaryRow>(
    `SELECT
       up.user_id,
       up.total_points,
       up.match_points,
       up.knockout_points,
       up.top_four_points,
       up.bracket_points,
       up.exact_scores,
       up.correct_outcomes,
       up.close_scores,
       up.blanks,
       up.updated_at,
       coalesce(mp.saved_matches, 0)::int AS saved_matches,
       coalesce(up.bracket->>'championTeamId', '') <> '' AS has_bracket,
       json_build_object('username', u.username, 'created_at', u.created_at) AS users
     FROM user_predictions up
     JOIN users u ON u.id = up.user_id
     LEFT JOIN (
       SELECT user_id, count(*)::int AS saved_matches
       FROM match_predictions
       WHERE tournament_code = $1
       GROUP BY user_id
     ) mp ON mp.user_id = up.user_id
     WHERE up.tournament_code = $1`,
    [TOURNAMENT_CODE]
  );

  return rows;
}

export async function getUserCommunityPredictions(userId: string) {
  const [header, matchRows] = await Promise.all([
    loadPredictionHeader(userId),
    loadMatchPredictionRows(userId)
  ]);

  if (!header && matchRows.length === 0) return null;

  const document = assemblePredictionDocument(header, matchRows);
  return {
    bracket: document.bracket?.championTeamId ? document.bracket : null,
    matchPredictions: Object.fromEntries(
      Object.entries(document.matches).map(([matchId, prediction]) => [
        matchId,
        {
          homeGoals: prediction.homeGoals,
          awayGoals: prediction.awayGoals,
          points: prediction.points
        }
      ])
    )
  };
}

export async function loadPredictionDocumentsForRecalc(): Promise<
  Array<{ userId: string; document: PredictionDocument; username: string; createdAt: string }>
> {
  const { rows: headers } = await query<
    PredictionHeaderRow & {
      username: string;
      user_created_at: string;
    }
  >(
    `SELECT up.id, up.user_id, up.bracket, up.top_four, up.total_points, up.match_points,
            up.knockout_points, up.top_four_points, up.bracket_points, up.exact_scores,
            up.correct_outcomes, up.close_scores, up.blanks, up.updated_at,
            u.username, u.created_at AS user_created_at
     FROM user_predictions up
     JOIN users u ON u.id = up.user_id
     WHERE up.tournament_code = $1`,
    [TOURNAMENT_CODE]
  );

  if (headers.length === 0) return [];

  const { rows: matchRows } = await query<
    MatchPredictionRow & { user_id: string }
  >(
    `SELECT user_id, match_external_id, home_team_id, away_team_id, home_goals, away_goals,
            predicted_winner_team_id, predicted_decided_by, saved_at, locked,
            points, points_breakdown
     FROM match_predictions
     WHERE tournament_code = $1`,
    [TOURNAMENT_CODE]
  );

  const matchesByUser = new Map<string, MatchPredictionRow[]>();
  for (const row of matchRows) {
    const bucket = matchesByUser.get(row.user_id) ?? [];
    bucket.push(row);
    matchesByUser.set(row.user_id, bucket);
  }

  return headers.map((header) => ({
    userId: header.user_id,
    document: assemblePredictionDocument(header, matchesByUser.get(header.user_id) ?? []),
    username: header.username,
    createdAt: header.user_created_at
  }));
}

/** @deprecated Prefer listPredictionSummaries or loadPredictionDocumentsForRecalc */
export async function listPredictionRows() {
  const summaries = await listPredictionSummaries();
  const documents = await loadPredictionDocumentsForRecalc();
  const byUserId = new Map(documents.map((entry) => [entry.userId, entry.document]));

  return summaries.map((summary) => ({
    user_id: summary.user_id,
    predictions: byUserId.get(summary.user_id) ?? createEmptyPredictionDocument(),
    total_points: summary.total_points,
    match_points: summary.match_points,
    top_four_points: summary.top_four_points,
    exact_scores: summary.exact_scores,
    correct_outcomes: summary.correct_outcomes,
    close_scores: summary.close_scores,
    blanks: summary.blanks,
    updated_at: summary.updated_at,
    users: summary.users
  }));
}
