import { ShieldAlert, TriangleAlert } from "lucide-react";
import { parseRedTeamReport } from "@/lib/red-team";
import { cn } from "@/lib/utils";

// Renders profiles.red_team_flaws. Accepts the raw column value so null or malformed data from the
// database shows an empty state instead of crashing.
export function RedTeamCard({ data }: { data: unknown }) {
  const report = parseRedTeamReport(data);
  const survival = report ? Number.parseInt(report.survival_probability, 10) : NaN;
  const meter = Number.isNaN(survival) ? 0 : Math.min(100, Math.max(0, survival));

  return (
    <section className="investment-bg rounded-2xl p-6 text-white shadow-xl sm:p-7">
      <div className="relative z-10">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-md">
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-[11px] font-bold tracking-[1.5px] text-orange-300 uppercase">
              <ShieldAlert className="h-3.5 w-3.5" /> Investor view
            </p>
            <h4 className="text-lg font-bold">⚠️ Tough Love: What an Investor Will Worry About</h4>
            <p className="mt-1 text-sm text-slate-300">The questions a careful investor will ask, so you can prepare your answers.</p>
            <div className="mt-3 h-1 w-12 rounded-full bg-orange-500" />
          </div>
          {report && (
            <div className="min-w-[150px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-bold tracking-[1.5px] text-slate-400 uppercase">Survival probability</p>
              <p
                className={cn(
                  "text-3xl font-extrabold tracking-tight",
                  survival >= 60 ? "text-emerald-400" : survival >= 30 ? "text-orange-400" : "text-red-400"
                )}
              >
                {report.survival_probability}
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-white/10">
                <div
                  className={cn("h-1.5 rounded-full", survival >= 60 ? "bg-emerald-400" : survival >= 30 ? "bg-orange-400" : "bg-red-400")}
                  style={{ width: `${meter}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {!report || !report.fatal_flaws.length ? (
          <p className="text-sm text-slate-300">
            Nothing here yet. Run an AI assessment and an experienced advisor will point out the biggest risks in your plan.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {report.fatal_flaws.map((flaw, i) => (
              <li key={i} className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-500 text-sm font-bold">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                        flaw.severity === "high" ? "bg-red-500 text-white" : "bg-orange-200 text-orange-900"
                      )}
                    >
                      <TriangleAlert className="h-3 w-3" />
                      {flaw.severity === "high" ? "High" : "Medium"}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed font-semibold">{flaw.flaw}</p>
                  {flaw.impact && (
                    <p className="mt-2 border-l-2 border-orange-500/60 pl-3 text-[13px] leading-relaxed text-slate-300">
                      <span className="font-semibold text-orange-300">What it could mean: </span>
                      {flaw.impact}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
