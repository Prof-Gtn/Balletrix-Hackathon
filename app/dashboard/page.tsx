import Link from "next/link";
import { Briefcase, FileUp, HeartHandshake, MessageCircle, Shield, Sparkles, Star } from "lucide-react";
import { GLOSSARY, InfoTip } from "@/components/info-tip";
import { PageTitle } from "@/components/page-title";
import { WelcomeTour } from "@/components/welcome-tour";
import { loadEntrepreneur } from "@/lib/entrepreneur";
import { fileNameFromPath, EVIDENCE_TYPE_LABELS, toEvidenceType } from "@/lib/evidence";
import { badges, nextMilestone, totalPoints } from "@/lib/gamification";
import { GATE_REQUIREMENTS } from "@/lib/gates";
import { PHASES } from "@/lib/incubation";
import { createClient } from "@/lib/supabase/server";

// Readiness score each month's gate asks for, for the "Current Phase" progress bar.
const GATE_SCORE = { 1: 50, 2: 65, 3: 80 } as const;

type RoadmapStep = { action: string; why: string };
type InterestedInvestor = { id: string; investor_id: string; email: string | null; status: string; created_at: string };

function topRoadmapSteps(value: unknown, count: number): RoadmapStep[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === "object" && typeof s.action === "string")
    .slice(0, count)
    .map((s) => ({ action: String(s.action), why: typeof s.why === "string" ? s.why : "" }));
}

function relativeTime(value: string): string {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default async function DashboardPage() {
  const data = await loadEntrepreneur({ requireOnboarding: true });
  // Investors who pressed "Express Interest". The function returns their email, which RLS on profiles
  // would otherwise hide; it errors (and the card shows nothing) until the matchmaking migration runs.
  const supabase = await createClient();
  const { data: interestRows, error: interestError } = await supabase.rpc("get_interested_investors");
  if (interestError) console.error("get_interested_investors failed", interestError);
  const investors = (interestRows ?? []) as InterestedInvestor[];
  const { profile, currentMonth, readinessScore, progress } = data;

  const points = totalPoints(progress);
  const earnedBadges = badges(progress).filter((b) => b.earned).length;
  const phase = PHASES[currentMonth];
  const phaseProgress = Math.min(100, Math.round((readinessScore / GATE_SCORE[currentMonth]) * 100));
  const nextSteps = topRoadmapSteps(profile?.roadmap, 3);
  const hasAssessment = data.assessments.length > 0 || readinessScore > 0;
  // Brand-new founders get the welcome tour.
  const isNewFounder = currentMonth === 1 && readinessScore === 0;

  // Recent activity from the user's own assessments and uploads, newest first.
  const activity = [...data.assessments, ...data.uploads]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3)
    .map((row) => {
      if (row.evidence_type === "business_assessment") {
        const passed = row.ai_verification_status === "verified";
        return {
          id: row.id,
          icon: Star,
          tone: "bg-blue-100 text-blue-500",
          text: passed ? `You passed the Month ${row.month} gate!` : `AI assessment completed for Month ${row.month}`,
          when: relativeTime(row.created_at),
        };
      }
      const type = toEvidenceType(row.evidence_type);
      return {
        id: row.id,
        icon: FileUp,
        tone: "bg-purple-100 text-purple-500",
        text: `${type ? EVIDENCE_TYPE_LABELS[type] : "Document"} uploaded: ${fileNameFromPath(row.file_url)}`,
        when: relativeTime(row.created_at),
      };
    });
  if (activity.length < 3 && profile?.business_name) {
    activity.push({ id: "profile", icon: Briefcase, tone: "bg-orange-100 text-orange-500", text: "Business profile created", when: "Getting started" });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageTitle title={`Welcome back, ${data.firstName}! 👋`} subtitle="Here's your business progress at a glance." />

      {data.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          We couldn&apos;t load all your information: {data.error}
        </p>
      )}

      {isNewFounder && <WelcomeTour firstName={data.firstName} userId={data.userId} />}

      {/* Next steps: the most important thing on the page. The top of the saved AI action plan. */}
      <section className="rounded-2xl border border-gray-100 border-l-4 border-l-orange-500 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Next Steps</h2>
        {nextSteps.length ? (
          <>
            <p className="mt-1 text-sm text-gray-500">From your AI action plan. Start with number 1.</p>
            <ol className="mt-6 space-y-3">
              {nextSteps.map((step, i) => (
                <li key={i} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <span
                      className={
                        i === 0
                          ? "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-500 text-sm font-bold text-white"
                          : "grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-gray-200 text-sm font-bold text-gray-500"
                      }
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{step.action}</p>
                      {step.why && <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{step.why}</p>}
                    </div>
                  </div>
                  <Link
                    href="/assessment"
                    className={
                      i === 0
                        ? "shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                        : "shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    }
                  >
                    Start
                  </Link>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className="mt-2">
            <p className="max-w-2xl leading-relaxed text-gray-600">
              {hasAssessment
                ? "Run your assessment again to get a fresh action plan."
                : `Start here. The AI will score your business and tell you exactly what to do next. To pass Month ${currentMonth} you need ${GATE_REQUIREMENTS[currentMonth].sentence}.`}
            </p>
            <Link
              href="/assessment"
              className="mt-6 inline-flex min-h-[56px] items-center gap-2 rounded-xl bg-orange-500 px-8 text-base font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
            >
              <Sparkles className="h-5 w-5" /> {hasAssessment ? "Go to Assessment" : "Run Your First AI Assessment"}
            </Link>
          </div>
        )}
      </section>

      {/* Top stats cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center justify-between h-full rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <p className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-500">
              Overall Readiness Score <InfoTip text={GLOSSARY.readinessScore} label="Readiness Score" />
            </p>
            <div className="flex items-center gap-3">
              <ScoreRing score={readinessScore} />
              <div className="text-xs font-medium text-orange-600">
                {readinessScore >= GATE_SCORE[currentMonth] ? "Gate ready" : readinessScore > 0 ? "Good progress" : "Not scored yet"}
                <br />
                <span className="text-gray-400">{readinessScore > 0 ? "Keep going!" : "Run an assessment"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-full rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="mb-2 text-sm font-medium text-gray-500">Current Phase</p>
          <h3 className="font-bold text-slate-800">Month {currentMonth}</h3>
          <p className="text-xs text-gray-500">{phase.name}</p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-gray-200">
            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${phaseProgress}%` }} />
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            {readinessScore} of {GATE_SCORE[currentMonth]} points needed for the gate
            <InfoTip text={GLOSSARY.gate} label="Gate" />
          </p>
        </div>

        <div className="h-full rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="mb-1 text-sm font-medium text-gray-500">Total Points</p>
          <h3 className="flex items-center justify-center gap-1 text-3xl font-bold text-slate-800">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /> {points.toLocaleString("en")}
          </h3>
          <p className="mt-2 text-xs text-gray-400">Next badge at {nextMilestone(points).toLocaleString("en")}</p>
        </div>

        <div className="h-full rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="mb-1 text-sm font-medium text-gray-500">Badges Earned</p>
          <h3 className="flex items-center justify-center gap-1 text-3xl font-bold text-slate-800">
            <Shield className="h-5 w-5 fill-yellow-500 text-yellow-500" /> {earnedBadges}
          </h3>
          <Link href="/gamification" className="mt-2 block text-xs text-blue-500 hover:underline">
            View all badges
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent activity */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Recent Activity</h2>
          {activity.length ? (
            <div className="relative space-y-4 before:absolute before:inset-0 before:ml-[13px] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {activity.map(({ id, icon: Icon, tone, text, when }) => (
                <div key={id} className="relative flex items-start gap-3">
                  <div className={`z-10 rounded-full p-1.5 ${tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium break-words text-slate-800">{text}</p>
                    <p className="text-xs text-gray-400">{when}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nothing yet. Your assessments and uploads will show up here.</p>
          )}
        </div>

        {/* Interested investors (matchmaking) */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
            <HeartHandshake className="h-5 w-5 text-orange-500" /> Interested Investors
          </h2>
          <p className="mb-4 text-sm text-gray-500">Investors who want to talk to you about funding your business.</p>
          {investors.length ? (
            <ul className="divide-y divide-gray-100">
              {investors.map((investor) => (
                <li key={investor.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{investor.email || "Investor"}</p>
                    <p className="text-xs text-gray-400">Interested {relativeTime(investor.created_at).toLowerCase()}</p>
                  </div>
                  <Link
                    href="/mentor"
                    className="inline-flex shrink-0 items-center gap-2 rounded bg-orange-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-orange-600"
                  >
                    <MessageCircle className="h-4 w-4" /> Message Investor
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-gray-200 p-5 text-sm text-gray-500">
              {currentMonth >= 3
                ? "No investors yet. Your business is visible in the Investor Marketplace, so keep your evidence up to date."
                : "Investors can find you once you reach Month 3. Keep passing your gates!"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// The template's circular "68%" indicator, drawn as a ring that fills with the score.
function ScoreRing({ score }: { score: number }) {
  const value = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 20;
  return (
    <div className="relative grid h-12 w-12 place-items-center" role="img" aria-label={`Readiness score ${value} out of 100`}>
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r="20" fill="none" stroke="#fed7aa" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="#f97316"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <span className="text-sm font-bold text-slate-800">{value}%</span>
    </div>
  );
}
