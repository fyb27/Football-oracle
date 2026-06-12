// Mirrors the backend response shapes (backend/src/engine/types.ts).

export type MatchResult = "W" | "D" | "L";
export type RiskLevel = "Low" | "Medium" | "High";
export type ConfidenceLabel =
  | "Low Confidence"
  | "Medium Confidence"
  | "High Confidence"
  | "Very High Confidence";

export interface TeamListItem {
  id: number;
  name: string;
  code: string;
  group: string;
  elo: number;
}

export interface Outcome {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export interface ScoreLine {
  home: number;
  away: number;
  probability: number;
  label: string;
}

export interface FactorContribution {
  key: string;
  label: string;
  weight: number;
  signal: number;
  contribution: number;
}

export interface RecentMatch {
  opponent: string;
  isHome: boolean;
  goalsFor: number;
  goalsAgainst: number;
  result: MatchResult;
  playedAt: string;
}

export interface TeamSummary {
  id: number;
  name: string;
  code: string;
  elo: number;
  form: MatchResult[];
  stats: {
    winRate: number;
    avgGoalsScored: number;
    avgGoalsConceded: number;
    xgFor: number;
    xgAgainst: number;
    cleanSheetRate: number;
    possession: number;
    shotsPerMatch: number;
    passAccuracy: number;
  };
  recentMatches: RecentMatch[];
}

export interface HeadToHead {
  meetings: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  homeGoals: number;
  awayGoals: number;
  recent: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeGoals: number;
    awayGoals: number;
    competition: string;
  }>;
}

export interface Insight {
  icon: string;
  title: string;
  tone: "positive" | "neutral" | "warning";
}

export interface MatchAnalysis {
  home: TeamSummary;
  away: TeamSummary;
  outcome: Outcome;
  expectedGoals: { home: number; away: number; total: number };
  confidence: { score: number; stars: number; label: ConfidenceLabel };
  risk: {
    level: RiskLevel;
    score: number;
    factors: {
      strengthGap: number;
      modelAgreement: number;
      historicalPredictability: number;
      formConsistency: number;
    };
  };
  topScores: ScoreLine[];
  scoreMatrix: number[][];
  factors: FactorContribution[];
  headToHead: HeadToHead;
  insights: Insight[];
  summary: string;
  generatedAt: string;
}

export interface BestMatchRow {
  homeId: number;
  awayId: number;
  match: string;
  homeName: string;
  awayName: string;
  homeCode: string;
  awayCode: string;
  winPrediction: string;
  outcome: Outcome;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  risk: RiskLevel;
  expectedGoals: number;
  mostLikelyScore: string;
  mostLikelyScoreProb: number;
}
