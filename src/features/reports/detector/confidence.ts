export type ConfidenceLevel = "exact" | "normalized" | "alias" | "fuzzy" | "none";

export const CONFIDENCE_SCORES = {
  EXACT: 1.0,
  NORMALIZED: 0.98,
  ALIAS: 0.95,
  FUZZY_HIGH: 0.85,
  FUZZY_MEDIUM: 0.7,
  LOW: 0.4,
  NONE: 0.0,
} as const;

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= CONFIDENCE_SCORES.EXACT) return "exact";
  if (score >= CONFIDENCE_SCORES.NORMALIZED) return "normalized";
  if (score >= CONFIDENCE_SCORES.ALIAS) return "alias";
  if (score >= CONFIDENCE_SCORES.FUZZY_MEDIUM) return "fuzzy";
  return "none";
}

export function isConfidentMatch(score: number, threshold = CONFIDENCE_SCORES.FUZZY_MEDIUM): boolean {
  return score >= threshold;
}
