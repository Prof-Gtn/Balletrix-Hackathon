import { ChevronDown, TriangleAlert } from "lucide-react";
import { parseRedTeamReport } from "@/lib/red-team";
import { cn } from "@/lib/utils";

// Renders profiles.red_team_flaws as a clean alert card. Accepts the raw column value so null or
// malformed data from the database shows an empty state instead of crashing.
export function RedTeamCard({ data }: { data: unknown }) {
  const report = parseRedTeamReport(data);
  const survival = report ? Number.parseInt(report.survival_probability, 10) : NaN;

  return (
    <section className="relative rounded-xl border border-gray-100 border-l-4 border-l-red-400 bg-white p-5 shadow-sm sm:p-6">
      {report && (
        <span
          className={cn(
            "absolute top-4 right-4 rounded-full px-2.5 py-1 text-xs font-semibold",
            survival >= 60 ? "bg-emerald-50 text-emerald-700" : survival >= 30 ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
          )}
          title="How likely an investor thinks this business is to survive, as it is today"
        >
          Survival {report.survival_probability}
        </span>
      )}

      <div className="pr-28">
        <h4 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <TriangleAlert className="h-4 w-4 text-red-500" /> Tough Love: What an Investor Will Worry About
        </h4>
        <p className="mt-1 text-sm text-gray-500">Prepare answers to these before you meet an investor.</p>
      </div>

      {!report || !report.fatal_flaws.length ? (
        <p className="mt-4 text-sm text-gray-500">
          Nothing here yet. Run an AI assessment and an experienced advisor will point out the biggest risks in your plan.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {report.fatal_flaws.map((flaw, i) => (
            <li key={i} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-snug font-bold text-slate-900">{flaw.title}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                    flaw.severity === "high" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                  )}
                >
                  {flaw.severity === "high" ? "High" : "Medium"}
                </span>
              </div>
              {flaw.impact && (
                <details className="group mt-1.5">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-gray-500 hover:text-slate-800 [&::-webkit-details-marker]:hidden">
                    See why this matters
                    <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm leading-relaxed text-slate-700">{flaw.impact}</p>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
