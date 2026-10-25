import { ChevronDown, TriangleAlert } from "lucide-react";
import { parseRedTeamReport } from "@/lib/red-team";
import { cn } from "@/lib/utils";

// Renders profiles.red_team_flaws as an accordion: each flaw shows its title and severity, and opens to
// explain why it matters. Accepts the raw column value so null or malformed data shows an empty state.
export function RedTeamCard({ data }: { data: unknown }) {
  const report = parseRedTeamReport(data);

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <TriangleAlert className="h-5 w-5 text-orange-500" /> Tough Love
          </h2>
          <p className="mt-1 text-sm text-gray-500">What an investor will worry about. Tap a point to see why it matters.</p>
        </div>
        {report && (
          <p className="text-right text-xs text-gray-500" title="How likely an investor thinks this business is to survive, as it is today">
            Survival chance
            <span className="block text-lg font-bold text-slate-800">{report.survival_probability}</span>
          </p>
        )}
      </div>

      {!report || !report.fatal_flaws.length ? (
        <p className="mt-6 text-sm text-gray-500">
          Nothing here yet. Run an AI assessment and an experienced advisor will point out the biggest risks in your plan.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-gray-100 border-y border-gray-100">
          {report.fatal_flaws.map((flaw, i) => (
            <li key={i}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1 text-sm leading-snug font-semibold text-slate-800">{flaw.title}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                      flaw.severity === "high" ? "border-red-200 text-red-700" : "border-amber-200 text-amber-700"
                    )}
                  >
                    {flaw.severity === "high" ? "High" : "Medium"}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition group-open:rotate-180" />
                </summary>
                {flaw.impact && <p className="pb-4 text-sm leading-relaxed text-gray-600">{flaw.impact}</p>}
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
