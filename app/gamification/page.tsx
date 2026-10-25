import Link from "next/link";
import { ArrowRight, Award, CheckCircle2, Compass, Lock, MapPin, Star } from "lucide-react";
import { BadgeGrid } from "@/components/badge-grid";
import { Card, PageTitle } from "@/components/page-title";
import { loadEntrepreneur } from "@/lib/entrepreneur";
import { badges, nextMilestone, totalPoints } from "@/lib/gamification";
import { PHASES } from "@/lib/incubation";
import { buildJourney, parsePlan, rankFor, type JourneyWeek } from "@/lib/twelve-week-plan";
import { cn } from "@/lib/utils";

export default async function GamificationPage() {
  const { profile, progress, currentMonth, readinessScore, uploads, error } = await loadEntrepreneur();
  const points = totalPoints(progress);
  const allBadges = badges(progress);
  const earned = allBadges.filter((b) => b.earned).length;
  const { rank, next } = rankFor(readinessScore);

  // Older accounts have no saved plan; parsePlan fills it with the default 12 weeks.
  const plan = parsePlan(profile?.twelve_week_plan);
  const { weeks, currentWeek } = buildJourney(plan.weeks, currentMonth, readinessScore);

  // The next step: get a first score, then proof for this month, then re-run to pass the gate.
  const hasVerifiedThisMonth = uploads.some((u) => u.month === currentMonth && u.ai_verification_status === "verified");
  const nextStep =
    readinessScore === 0
      ? { href: "/assessment", hint: "Start by running your AI assessment." }
      : !hasVerifiedThisMonth
        ? { href: "/evidence", hint: `Upload proof for Month ${currentMonth} in the Evidence Centre.` }
        : { href: "/assessment", hint: "Run your assessment again to pass this month's gate." };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <PageTitle title="Gamification" subtitle="Earn points and badges, and follow your 12-week journey to investment readiness." />

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">We couldn&apos;t load your progress: {error}</p>}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="text-center">
          <p className="mb-1 text-sm font-medium text-gray-500">Total Points</p>
          <p className="flex items-center justify-center gap-1 text-3xl font-bold text-slate-800">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /> {points.toLocaleString("en")}
          </p>
          <p className="mt-2 text-xs text-gray-400">Next badge at {nextMilestone(points).toLocaleString("en")}</p>
        </Card>
        <Card className="text-center">
          <p className="mb-1 text-sm font-medium text-gray-500">Badges Earned</p>
          <p className="flex items-center justify-center gap-1 text-3xl font-bold text-slate-800">
            <Award className="h-5 w-5 text-orange-500" /> {earned} / {allBadges.length}
          </p>
          <div className="mx-auto mt-3 h-1.5 max-w-[220px] rounded-full bg-gray-100">
            <div className="h-1.5 rounded-full bg-orange-500" style={{ width: `${(earned / allBadges.length) * 100}%` }} />
          </div>
        </Card>
        <Card className="text-center">
          <p className="mb-1 text-sm font-medium text-gray-500">Your Rank</p>
          <p className="flex items-center justify-center gap-1.5 text-3xl font-bold text-slate-800">
            <Compass className="h-5 w-5 text-orange-500" /> {rank.name}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            {next ? `Reach a score of ${next.min} to become ${next.name}` : "The top rank. Keep your evidence up to date!"}
          </p>
        </Card>
      </div>

      {/* Badges */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-800">Your Badges</h2>
        <BadgeGrid badges={allBadges} />
      </section>

      {/* 12-week journey map */}
      <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Your 12-Week Incubation Journey</h2>
        <p className="mt-1 text-sm text-gray-500">
          {plan.personalised
            ? "Your personal plan from your latest AI assessment. "
            : "A starter plan. Run your AI assessment to get weeks written for your business. "}
          Each month&apos;s weeks unlock when you pass the gate before it.
        </p>

        <ol className="mt-8 ml-4 border-l-2 border-gray-200">
          {weeks.map((week) => (
            <JourneyNode key={week.week} week={week} />
          ))}
        </ol>

        <div className="mt-6 flex flex-col items-start gap-3 border-t border-gray-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">{nextStep.hint}</p>
          <Link
            href={nextStep.href}
            className="inline-flex min-h-[56px] items-center gap-2 rounded-xl bg-orange-500 px-8 text-base font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
          >
            Continue to Week {currentWeek} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function JourneyNode({ week }: { week: JourneyWeek }) {
  const locked = week.state === "locked";
  // A new month starts every 4 weeks; label it so the gates read clearly on the line.
  const startsMonth = (week.week - 1) % 4 === 0;

  return (
    <li className="relative pb-8 pl-10 last:pb-0">
      {startsMonth && (
        <p className="mb-3 text-xs font-bold tracking-wide text-gray-400 uppercase">
          Month {week.month}: {PHASES[week.month].name}
        </p>
      )}
      <span
        aria-hidden
        className={cn(
          "absolute -left-[17px] grid h-8 w-8 place-items-center rounded-full ring-4 ring-white",
          startsMonth && "top-8",
          week.state === "completed" && "bg-emerald-500 text-white",
          week.state === "current" && "animate-pulse bg-orange-500 text-white shadow-lg shadow-orange-500/40",
          week.state === "upcoming" && "border-2 border-orange-300 bg-white text-orange-500",
          locked && "bg-gray-100 text-gray-400"
        )}
      >
        {week.state === "completed" ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : week.state === "current" ? (
          <MapPin className="h-4 w-4" />
        ) : locked ? (
          <Lock className="h-4 w-4" />
        ) : (
          <span className="text-xs font-bold">{week.week}</span>
        )}
      </span>

      <div className={cn("rounded-xl p-4", week.state === "current" ? "border border-orange-200 bg-orange-50/50" : "border border-transparent")}>
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("font-bold", locked ? "text-gray-400" : "text-slate-800")}>Week {week.week}</p>
          {week.state === "current" && (
            <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white">You are here</span>
          )}
          {week.state === "completed" && <span className="text-xs font-medium text-emerald-600">Done</span>}
          {locked && <span className="text-xs text-gray-400">Unlocks in Month {week.month}</span>}
        </div>
        <p className={cn("mt-1 text-sm font-semibold", locked ? "text-gray-400" : "text-orange-600")}>{week.focus}</p>
        {locked ? (
          <p className="mt-1 text-sm text-gray-400 blur-[3px] select-none" aria-hidden>
            {week.task}
          </p>
        ) : (
          <p className={cn("mt-1 text-sm leading-relaxed", week.state === "completed" ? "text-gray-500" : "text-slate-700")}>
            {week.task}
          </p>
        )}
      </div>
    </li>
  );
}
