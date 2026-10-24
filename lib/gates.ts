// Incubation gate thresholds, shared by the AI engine (lib/claude.ts) and the dashboard.
export const GATE_REQUIREMENTS = {
  1: { summary: "Readiness 50+ and Scalability 5+", sentence: "a readiness score of at least 50 and a scalability score of at least 5" },
  2: { summary: "Readiness 65+ and Profitability 6+", sentence: "a readiness score of at least 65 and a profitability score of at least 6" },
  3: { summary: "Readiness 80+", sentence: "a readiness score of at least 80" },
} as const;

export type IncubationMonth = keyof typeof GATE_REQUIREMENTS;

export function toIncubationMonth(month: number): IncubationMonth {
  return Math.min(3, Math.max(1, Math.trunc(month) || 1)) as IncubationMonth;
}
