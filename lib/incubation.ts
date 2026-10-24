import { GATE_REQUIREMENTS, type IncubationMonth } from "@/lib/gates";

// The three-month incubation programme: what each month focuses on and what it takes to move on.
export const PHASES: Record<IncubationMonth, { name: string; focus: string; milestones: string[]; gate: string }> = {
  1: {
    name: "Innovation & Market Validation",
    focus: "Prove people want what you sell.",
    milestones: [
      "Describe your business or upload your business plan",
      "Get your first AI assessment and action plan",
      "Upload a signed contract, invoice or bank statement",
    ],
    gate: GATE_REQUIREMENTS[1].summary,
  },
  2: {
    name: "Profitability & Traction",
    focus: "Show that each sale makes money.",
    milestones: [
      "Track your daily sales and costs",
      "Work out your profit per sale",
      "Upload proof of repeat customers or regular income",
    ],
    gate: GATE_REQUIREMENTS[2].summary,
  },
  3: {
    name: "Investment Readiness",
    focus: "Get ready to talk to investors.",
    milestones: [
      "Complete your business profile",
      "Generate your Due Diligence Package",
      "Meet investors interested in your sector",
    ],
    gate: GATE_REQUIREMENTS[3].summary,
  },
};
