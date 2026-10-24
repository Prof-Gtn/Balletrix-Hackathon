import { Award, Star } from "lucide-react";
import { BadgeGrid } from "@/components/badge-grid";
import { Card, PageTitle } from "@/components/page-title";
import { loadEntrepreneur } from "@/lib/entrepreneur";
import { badges, nextMilestone, totalPoints } from "@/lib/gamification";

export default async function GamificationPage() {
  const { progress, error } = await loadEntrepreneur();
  const points = totalPoints(progress);
  const allBadges = badges(progress);
  const earned = allBadges.filter((b) => b.earned).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageTitle title="Gamification" subtitle="Earn points and badges as your business gets more investment ready." />

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">We couldn&apos;t load your progress: {error}</p>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
            <Award className="h-5 w-5 text-yellow-500" /> {earned} / {allBadges.length}
          </p>
          <div className="mx-auto mt-3 h-1.5 max-w-[220px] rounded-full bg-gray-100">
            <div className="h-1.5 rounded-full bg-orange-500" style={{ width: `${(earned / allBadges.length) * 100}%` }} />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-800">Your Badges</h2>
        <BadgeGrid badges={allBadges} />
      </div>
    </div>
  );
}
