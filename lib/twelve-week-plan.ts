import { toIncubationMonth, type IncubationMonth } from "@/lib/gates";

// The 12-week journey on the Gamification page: the AI's plan (profiles.twelve_week_plan), each week's
// state, and the founder's rank. Week completion isn't stored, so it is worked out from the month and
// the score's progress towards the current gate.

export type PlanWeek = { week: number; focus: string; task: string };
export type WeekState = "completed" | "current" | "upcoming" | "locked";
export type JourneyWeek = PlanWeek & { state: WeekState; month: IncubationMonth };

const WEEKS = 12;
const WEEKS_PER_MONTH = 4;
// The readiness score each month's gate asks for (see GATE_REQUIREMENTS).
const GATE_SCORE: Record<IncubationMonth, number> = { 1: 50, 2: 65, 3: 80 };

// Shown to accounts assessed before the AI wrote 12-week plans, and used to fill any missing week.
export const FALLBACK_PLAN: PlanWeek[] = [
  { week: 1, focus: "Know your customer", task: "Talk to 10 customers and write down why they buy from you." },
  { week: 2, focus: "Record every sale", task: "Start a daily sales and costs book, on paper or on your phone." },
  { week: 3, focus: "Collect proof", task: "Upload a signed contract, invoices or a bank statement to the Evidence Centre." },
  { week: 4, focus: "Grow beyond your own hours", task: "Find one task a tool, partner or helper could do so you can serve more customers." },
  { week: 5, focus: "Know your costs", task: "Work out what each product or service costs you to make or deliver." },
  { week: 6, focus: "Price for profit", task: "Check that every price covers its cost plus a profit, and fix the ones that don't." },
  { week: 7, focus: "Win repeat customers", task: "Offer a simple reason to come back, like a loyalty card or a monthly deal." },
  { week: 8, focus: "Prove your income", task: "Upload your latest bank statement as a PDF from your bank." },
  { week: 9, focus: "Get registered", task: "Upload your BIPA registration and NamRA certificate of good standing." },
  { week: 10, focus: "Plan the money", task: "Write down how much funding you need and exactly what you will spend it on." },
  { week: 11, focus: "Tell your story", task: "Generate your pitch deck outline in Reports and practise it out loud." },
  { week: 12, focus: "Meet investors", task: "Generate your Investor Trust Pack and answer every Tough Love point." },
];

function isPlanWeek(value: unknown): value is PlanWeek {
  if (!value || typeof value !== "object") return false;
  const w = value as Record<string, unknown>;
  return typeof w.week === "number" && typeof w.focus === "string" && typeof w.task === "string" && Boolean(w.task.trim());
}

// Reads profiles.twelve_week_plan defensively. Missing or malformed weeks fall back to the default plan,
// so the journey always has exactly 12 weeks.
export function parsePlan(value: unknown): { weeks: PlanWeek[]; personalised: boolean } {
  const saved = Array.isArray(value) ? value.filter(isPlanWeek) : [];
  const byWeek = new Map(saved.map((w) => [w.week, w]));
  const weeks = FALLBACK_PLAN.map((fallback) => byWeek.get(fallback.week) ?? fallback);
  return { weeks, personalised: saved.length > 0 };
}

export function buildJourney(plan: PlanWeek[], currentMonth: number, readinessScore: number) {
  const month = toIncubationMonth(currentMonth);
  const unlockedThrough = month * WEEKS_PER_MONTH;
  const firstWeekOfMonth = (month - 1) * WEEKS_PER_MONTH + 1;
  // Progress through this month's 4 weeks follows the score's progress towards this month's gate; the
  // last week stays current until the gate is passed (which moves the founder to the next month).
  const progress = Math.min(1, Math.max(0, readinessScore) / GATE_SCORE[month]);
  const weeksDone = Math.min(WEEKS_PER_MONTH - 1, Math.floor(progress * WEEKS_PER_MONTH));
  const currentWeek = firstWeekOfMonth + weeksDone;

  const weeks: JourneyWeek[] = plan.slice(0, WEEKS).map((w) => {
    const state: WeekState =
      w.week > unlockedThrough ? "locked" : w.week < currentWeek ? "completed" : w.week === currentWeek ? "current" : "upcoming";
    return { ...w, state, month: toIncubationMonth(Math.ceil(w.week / WEEKS_PER_MONTH)) };
  });
  return { weeks, currentWeek };
}

export const RANKS = [
  { name: "Explorer", min: 0 },
  { name: "Builder", min: 40 },
  { name: "Investor Ready", min: 70 },
] as const;

export function rankFor(readinessScore: number) {
  const index = RANKS.filter((r) => readinessScore >= r.min).length - 1;
  const rank = RANKS[Math.max(0, index)];
  const next = index + 1 < RANKS.length ? RANKS[index + 1] : null;
  return { rank, next };
}
