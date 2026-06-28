import type { DecisionMethod } from "@/lib/decision-method";

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
  winner_team_id?: string | null;
  decided_by?: DecisionMethod | string | null;
  payload?: Record<string, unknown>;
  home_team?: Team | null;
  away_team?: Team | null;
};

export type MatchPredictionPoints = {
  pointsScore: number;
  pointsQualified: number;
  pointsMethod: number;
  totalPoints: number;
};

export type MatchPrediction = {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeGoals: number;
  awayGoals: number;
  predictedWinnerTeamId?: string | null;
  predictedDecidedBy?: DecisionMethod | null;
  savedAt: string;
  locked: boolean;
  points: number | null;
  pointsBreakdown?: MatchPredictionPoints | null;
};

export type TopFourPrediction = {
  first: string;
  second: string;
  third: string;
  fourth: string;
  savedAt: string;
  points: number | null;
};

export type BracketSlotPrediction = {
  slot: string;
  teamId: string;
};

export type BracketTopFourSlot = {
  position: number;
  teamId: string;
};

export type BracketEditorState = {
  firstRoundTeams: Record<string, { top: string | null; bottom: string | null }>;
  picks: Record<string, Record<string, string>>;
  thirdPlaceTeamId: string | null;
};

export type BracketPrediction = {
  quarterFinals: BracketSlotPrediction[];
  semiFinals: BracketSlotPrediction[];
  final: BracketSlotPrediction[];
  championTeamId: string | null;
  runnerUpTeamId: string | null;
  top4: BracketTopFourSlot[];
  editor?: BracketEditorState | null;
  savedAt: string;
  locked: boolean;
  points: number | null;
  pointsBreakdown?: {
    pointsQuarterFinalists: number;
    pointsSemiFinalists: number;
    pointsFinalists: number;
    pointsChampion: number;
    pointsRunnerUp: number;
    pointsTop4: number;
    totalPoints: number;
  } | null;
};

export type PredictionDocument = {
  version: 1 | 2;
  tournamentCode: string;
  updatedAt: string;
  matches: Record<string, MatchPrediction>;
  topFour: TopFourPrediction | null;
  bracket: BracketPrediction | null;
  summary: {
    totalPoints: number;
    matchPoints: number;
    knockoutPoints: number;
    topFourPoints: number;
    bracketPoints: number;
    exactScores: number;
    correctOutcomes: number;
    closeScores: number;
    blanks: number;
    lastCalculatedAt: string | null;
  };
};

export type GroupStanding = {
  team: Team | null;
  mp: number;
  w: number;
  d: number;
  l: number;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
};

export type GroupTable = {
  group: string;
  standings: GroupStanding[];
};

export type RankingRow = {
  position: number;
  userId: string;
  username: string;
  totalPoints: number;
  matchPoints: number;
  knockoutPoints: number;
  topFourPoints: number;
  bracketPoints: number;
  exactScores: number;
  correctOutcomes: number;
  closeScores: number;
  blanks: number;
  updatedAt: string;
};
