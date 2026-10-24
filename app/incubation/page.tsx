import Link from "next/link";
import { CheckCircle2, Circle, Lock, Rocket } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { loadEntrepreneur } from "@/lib/entrepreneur";
import type { IncubationMonth } from "@/lib/gates";
import { PHASES } from "@/lib/incubation";
import { cn } from "@/lib/utils";

const MONTHS: IncubationMonth[] = [1, 2, 3];

export default async function IncubationPage() {
  const { currentMonth, readinessScore, error } = await loadEntrepreneur();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageTitle title="Incubation Programme" subtitle="Three months, three gates. Pass each gate to unlock the next month." />

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">We couldn&apos;t load your progress: {error}</p>}

      <ol className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {MONTHS.map((month) => {
          const phase = PHASES[month];
          const status = month < currentMonth ? "done" : month === currentMonth ? "current" : "locked";
          return (
            <li
              key={month}
              className={cn(
                "flex flex-col rounded-xl border bg-white p-6 shadow-sm",
                status === "current" ? "border-orange-500 ring-4 ring-orange-500/10" : "border-gray-100",
                status === "locked" && "opacity-70"
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold",
                    status === "done" && "bg-emerald-50 text-emerald-700",
                    status === "current" && "bg-orange-50 text-orange-600",
                    status === "locked" && "bg-gray-100 text-gray-500"
                  )}
                >
                  {status === "done" ? "Completed" : status === "current" ? "In progress" : "Locked"}
                </span>
                {status === "done" ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                ) : status === "current" ? (
                  <Rocket className="h-6 w-6 text-orange-500" />
                ) : (
                  <Lock className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <p className="text-xs font-bold tracking-[2px] text-gray-400 uppercase">Month {month}</p>
              <h2 className="mt-1 text-lg font-bold text-slate-800">{phase.name}</h2>
              <p className="mt-1 text-sm text-gray-500">{phase.focus}</p>

              <ul className="mt-5 flex-1 space-y-3">
                {phase.milestones.map((milestone) => (
                  <li key={milestone} className="flex items-start gap-2.5 text-sm text-slate-700">
                    {status === "done" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                    )}
                    {milestone}
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                <span className="font-bold text-slate-700">Gate to pass:</span> {phase.gate}
                {status === "current" && <span className="mt-1 block">Your score now: {readinessScore}/100</span>}
              </div>

              {status === "current" && (
                <Link href="/assessment" className="mt-4 rounded-lg bg-orange-500 py-2.5 text-center text-sm font-medium text-white transition hover:bg-orange-600">
                  Work on this month
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
