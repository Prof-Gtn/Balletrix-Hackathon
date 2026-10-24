import { Award, Lock, Medal, Star, Trophy } from "lucide-react";
import { Card, PageTitle } from "@/components/page-title";
import { loadEntrepreneur } from "@/lib/entrepreneur";
import { badges, nextMilestone, totalPoints } from "@/lib/gamification";
import { cn, initials } from "@/lib/utils";

// Sample entrepreneurs for the demo leaderboard; only the signed-in user's row is real.
const SAMPLE_ENTREPRENEURS = [
  { name: "Ndapewa Shikongo", business: "Oshana Solar Kiosks", points: 1840 },
  { name: "Johannes Hamutenya", business: "Kunene Goat Dairy", points: 1420 },
  { name: "Selma Iipinge", business: "Windhoek Laundry Hub", points: 1190 },
  { name: "Petrus Nghifindaka", business: "Rundu Fresh Fish", points: 860 },
  { name: "Maria Kandjii", business: "Swakop Craft Co.", points: 640 },
];

export default async function GamificationPage() {
  const { name, profile, progress, error } = await loadEntrepreneur();
  const points = totalPoints(progress);
  const allBadges = badges(progress);

  const leaderboard = [
    ...SAMPLE_ENTREPRENEURS.map((row) => ({ ...row, isYou: false })),
    { name, business: profile?.business_name || "Your business", points, isYou: true },
  ].sort((a, b) => b.points - a.points);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageTitle title="Gamification" subtitle="Earn points and badges as your business gets more investment ready." />

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">We couldn&apos;t load your progress: {error}</p>}

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
            <Award className="h-5 w-5 text-yellow-500" /> {allBadges.filter((b) => b.earned).length} / {allBadges.length}
          </p>
        </Card>
        <Card className="text-center">
          <p className="mb-1 text-sm font-medium text-gray-500">Your Rank</p>
          <p className="flex items-center justify-center gap-1 text-3xl font-bold text-slate-800">
            <Trophy className="h-5 w-5 text-orange-500" /> #{leaderboard.findIndex((row) => row.isYou) + 1}
          </p>
          <p className="mt-2 text-xs text-gray-400">of {leaderboard.length} entrepreneurs</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold">Leaderboard</h2>
            <p className="text-xs text-gray-400">Other entrepreneurs shown are sample data for the demo.</p>
          </div>
          <ol className="space-y-2">
            {leaderboard.map((row, i) => (
              <li
                key={`${row.name}-${i}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3",
                  row.isYou ? "border-orange-500 bg-orange-50" : "border-gray-100"
                )}
              >
                <span className={cn("w-6 text-center text-sm font-bold", i < 3 ? "text-orange-500" : "text-gray-400")}>
                  {i < 3 ? <Medal className="mx-auto h-5 w-5" /> : i + 1}
                </span>
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white", row.isYou ? "bg-orange-500" : "bg-slate-700")}>
                  {initials(row.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {row.name} {row.isYou && <span className="text-xs font-bold text-orange-600">(You)</span>}
                  </p>
                  <p className="truncate text-xs text-gray-400">{row.business}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-bold text-slate-800">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {row.points.toLocaleString("en")}
                </span>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold">Your Badges</h2>
          <ul className="grid grid-cols-2 gap-3">
            {allBadges.map((badge) => (
              <li
                key={badge.id}
                className={cn(
                  "rounded-lg border p-3 text-center",
                  badge.earned ? "border-yellow-200 bg-yellow-50" : "border-gray-100 bg-gray-50 opacity-60"
                )}
              >
                {badge.earned ? (
                  <Award className="mx-auto mb-1 h-7 w-7 text-yellow-500" />
                ) : (
                  <Lock className="mx-auto mb-1 h-7 w-7 text-gray-400" />
                )}
                <p className="text-xs font-bold text-slate-800">{badge.name}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-gray-500">{badge.description}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
