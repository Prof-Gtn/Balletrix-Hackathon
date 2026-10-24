// Points and badges, derived from the entrepreneur's real progress so the dashboard and the
// Gamification page always agree. Nothing here is stored.

export type Progress = {
  readinessScore: number;
  currentMonth: number;
  checkedDocuments: number; // verified uploads across all months
  assessments: number;
  profileComplete: boolean;
};

export type Badge = { id: string; name: string; description: string; earned: boolean };

const POINTS_STEP = 500;

export function totalPoints(p: Progress): number {
  return (
    Math.max(0, Math.round(p.readinessScore)) * 10 +
    (Math.max(1, p.currentMonth) - 1) * 250 +
    p.checkedDocuments * 100 +
    Math.min(p.assessments, 10) * 20 +
    (p.profileComplete ? 50 : 0)
  );
}

// The next round number of points, shown as "Next badge at 1,500".
export function nextMilestone(points: number): number {
  return (Math.floor(points / POINTS_STEP) + 1) * POINTS_STEP;
}

export function badges(p: Progress): Badge[] {
  return [
    { id: "profile", name: "Business Builder", description: "Completed your business profile", earned: p.profileComplete },
    { id: "first-assessment", name: "First Step", description: "Ran your first AI assessment", earned: p.assessments > 0 },
    { id: "proof", name: "Proof Provider", description: "Had a document checked", earned: p.checkedDocuments > 0 },
    { id: "month-1", name: "Market Validator", description: "Passed the Month 1 gate", earned: p.currentMonth >= 2 },
    { id: "month-2", name: "Profit Maker", description: "Passed the Month 2 gate", earned: p.currentMonth >= 3 },
    { id: "investor-ready", name: "Investor Ready", description: "Reached a readiness score of 80", earned: p.readinessScore >= 80 },
  ];
}
