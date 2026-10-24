// Devil's Advocate output, stored in profiles.red_team_flaws. Shared by the agent and the dashboard.
export type FlawSeverity = "high" | "medium";

export type RedTeamReport = {
  fatal_flaws: { flaw: string; severity: FlawSeverity; impact: string }[];
  survival_probability: string; // e.g. "35%"
};

// Normalises "35", "35%" or 35 to "35%", clamped to 0-100. Returns null if no number is present.
export function toPercent(value: unknown): string | null {
  const match = String(value ?? "").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  return `${Math.min(100, Math.max(0, Math.round(Number(match[0]))))}%`;
}

// Reads profiles.red_team_flaws defensively: null, missing fields or malformed JSON return null
// (or drop the bad entries) instead of crashing the dashboard.
export function parseRedTeamReport(value: unknown): RedTeamReport | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { fatal_flaws?: unknown; survival_probability?: unknown };

  const fatal_flaws = (Array.isArray(raw.fatal_flaws) ? raw.fatal_flaws : [])
    .filter((f): f is Record<string, unknown> => Boolean(f) && typeof f === "object")
    .map((f) => ({
      flaw: typeof f.flaw === "string" ? f.flaw.trim() : "",
      severity: (f.severity === "high" ? "high" : "medium") as FlawSeverity,
      impact: typeof f.impact === "string" ? f.impact.trim() : "",
    }))
    .filter((f) => f.flaw);

  const survival_probability = toPercent(raw.survival_probability);
  if (!fatal_flaws.length && !survival_probability) return null;

  return { fatal_flaws, survival_probability: survival_probability ?? "Unknown" };
}
