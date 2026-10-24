// Points and badges, derived from the entrepreneur's real progress so the dashboard and the
// Gamification page always agree. Nothing here is stored.

export type Progress = {
  hasBusinessName: boolean;
  readinessScore: number;
  currentMonth: number;
  checkedDocuments: number; // verified uploads across all months
  uploadedDocuments: number;
  assessments: number;
  profileComplete: boolean;
};

export type Badge = {
  id: string;
  name: string;
  description: string; // what the badge means
  howToEarn: string; // shown when the card is opened
  earned: boolean;
  // Progress towards the badge, e.g. 42 of 80 points.
  current: number;
  target: number;
  progressLabel: string;
};

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

const capped = (value: number, target: number) => Math.min(target, Math.max(0, Math.round(value)));

export function badges(p: Progress): Badge[] {
  const gatesPassed = Math.max(0, Math.min(2, p.currentMonth - 1));
  return [
    {
      id: "business-builder",
      name: "Business Builder",
      description: "You've told us about your business.",
      howToEarn: "Add your business name on the Business Profile page.",
      earned: p.hasBusinessName,
      current: p.hasBusinessName ? 1 : 0,
      target: 1,
      progressLabel: `${p.hasBusinessName ? 1 : 0} of 1 steps completed`,
    },
    {
      id: "first-step",
      name: "First Step",
      description: "You've had your business scored by the AI.",
      howToEarn: "Run your first AI assessment on the Assessment page.",
      earned: p.readinessScore > 0,
      current: p.readinessScore > 0 ? 1 : 0,
      target: 1,
      progressLabel: `${p.readinessScore > 0 ? 1 : 0} of 1 steps completed`,
    },
    {
      id: "proof-provider",
      name: "Proof Provider",
      description: "One of your documents has been checked.",
      howToEarn: "Upload a signed contract, invoice, bank statement or registration document in the Evidence Centre.",
      earned: p.checkedDocuments >= 1,
      current: capped(p.checkedDocuments, 1),
      target: 1,
      progressLabel: `${capped(p.checkedDocuments, 1)} of 1 checked documents`,
    },
    {
      id: "market-validator",
      name: "Market Validator",
      description: "You passed the Month 1 gate.",
      howToEarn: "Reach a readiness score of 50 with a scalability score of 5, then pass the Month 1 gate.",
      earned: p.currentMonth >= 2,
      current: p.currentMonth >= 2 ? 50 : capped(p.readinessScore, 50),
      target: 50,
      progressLabel: p.currentMonth >= 2 ? "Gate passed" : `${capped(p.readinessScore, 50)} of 50 points`,
    },
    {
      id: "profit-maker",
      name: "Profit Maker",
      description: "You passed the Month 2 gate.",
      howToEarn: "Pass the Month 1 and Month 2 gates. Month 2 needs a score of 65 and a profitability score of 6.",
      earned: p.currentMonth >= 3,
      current: gatesPassed,
      target: 2,
      progressLabel: `${gatesPassed} of 2 gates passed`,
    },
    {
      id: "investor-ready",
      name: "Investor Ready",
      description: "Your business scores 80 or more.",
      howToEarn: "Reach an Investment Readiness Score of 80. Checked documents and your action plan help you get there.",
      earned: p.readinessScore >= 80,
      current: capped(p.readinessScore, 80),
      target: 80,
      progressLabel: `${capped(p.readinessScore, 80)} of 80 points`,
    },
  ];
}
