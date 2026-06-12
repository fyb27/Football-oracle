import type { RecentMatch, HeadToHead, MatchResult } from "../data/types.js";

/** The three-way outcome probabilities, as percentages that sum to ~100. */
export interface Outcome {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export interface ScoreLine {
  home: number;
  away: number;
  /** Probability as a percentage. */
  probability: number;
  label: string; // e.g. "2-1"
}

export interface FactorContribution {
  key: string;
  label: string;
  weight: number; // 0..1
  /** Signal in -1..1; positive favours the home team. */
  signal: number;
  /** Weighted signal contribution. */
  contribution: number;
}

export type RiskLevel = "Low" | "Medium" | "High";
export type ConfidenceLabel =
  | "Low Confidence"
  | "Medium Confidence"
  | "High Confidence"
  | "Very High Confidence";

export interface TeamSummary {
  id: number;
  name: string;
  code: string;
  elo: number;
  form: MatchResult[]; // most-recent first
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

export interface Insight {
  icon: string;
  title: string;
  tone: "positive" | "neutral" | "warning";
}

export interface MatchAnalysis {
  home: TeamSummary;
  away: TeamSummary;
  /** Final blended probabilities shown to the user. */
  outcome: Outcome;
  expectedGoals: { home: number; away: number; total: number };
  confidence: {
    score: number; // 0..100
    stars: number; // 0..5
    label: ConfidenceLabel;
  };
  risk: {
    level: RiskLevel;
    score: number; // 0..100, higher = riskier/less predictable
    factors: {
      strengthGap: number;
      modelAgreement: number;
      historicalPredictability: number;
      formConsistency: number;
    };
  };
  topScores: ScoreLine[];
  /** Full 0-0..maxGoals matrix for the heatmap (probabilities as %). */
  scoreMatrix: number[][];
  factors: FactorContribution[];
  headToHead: HeadToHead;
  insights: Insight[];
  summary: string;
  generatedAt: string;
}
