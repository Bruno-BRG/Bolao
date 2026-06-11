export type User = {
  id: string;
  username: string;
  created_at: string;
};

export type Team = {
  external_id: string;
  fifa_code: string | null;
  iso2: string | null;
  name: string;
  flag_url: string | null;
  payload?: Record<string, unknown>;
};

export type Match = {
  external_id: string;
  tournament_code: string;
  home_team_id: string | null;
  away_team_id: string | null;
  starts_at: string;
  stage: string | null;
  group_name: string | null;
  status: string;
  score_home: number | null;
  score_away: number | null;
  payload?: Record<string, unknown>;
  home_team?: Team | null;
  away_team?: Team | null;
};

export type MatchPrediction = {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeGoals: number;
  awayGoals: number;
  savedAt: string;
  locked: boolean;
  points: number | null;
};

export type TopFourPrediction = {
  first: string;
  second: string;
  third: string;
  fourth: string;
  savedAt: string;
  points: number | null;
};

export type PredictionDocument = {
  version: 1;
  tournamentCode: string;
  updatedAt: string;
  matches: Record<string, MatchPrediction>;
  topFour: TopFourPrediction | null;
  summary: {
    totalPoints: number;
    matchPoints: number;
    topFourPoints: number;
    exactScores: number;
    correctOutcomes: number;
    closeScores: number;
    blanks: number;
    lastCalculatedAt: string | null;
  };
};

export type RankingRow = {
  position: number;
  userId: string;
  username: string;
  totalPoints: number;
  matchPoints: number;
  topFourPoints: number;
  exactScores: number;
  correctOutcomes: number;
  closeScores: number;
  blanks: number;
  updatedAt: string;
};
