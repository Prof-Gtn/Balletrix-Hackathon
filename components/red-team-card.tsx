import { Skull } from "lucide-react";
import { parseRedTeamReport } from "@/lib/red-team";
import { cn } from "@/lib/utils";

// Renders profiles.red_team_flaws. Accepts the raw column value so null or malformed data from the
// database shows an empty state instead of crashing.
export function RedTeamCard({ data }: { data: unknown }) {
  const report = parseRedTeamReport(data);
  const survival = report ? Number.parseInt(report.survival_probability, 10) : NaN;

  return (
    <section className="rounded-2xl border-2 border-danger/60 bg-[#2a0d14] p-5 text-white">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold">⚠️ Red Team Analysis (Venture Capitalist Critique)</h4>
          <p className="mt-1 text-[11px] text-[#e6b3bd]">The harshest investor case against your business.</p>
        </div>
        {report && (
          <div className="rounded-xl bg-black/30 px-3 py-2 text-right">
            <p className="text-[10px] tracking-[1px] text-[#e6b3bd] uppercase">Survival probability</p>
            <p
              className={cn(
                "text-[22px] font-extrabold tracking-[-0.4px]",
                survival >= 60 ? "text-[#7be3c0]" : survival >= 30 ? "text-[#ffd27a]" : "text-[#ff8fa3]"
              )}
            >
              {report.survival_probability}
            </p>
          </div>
        )}
      </div>

      {!report || !report.fatal_flaws.length ? (
        <p className="text-xs text-[#e6b3bd]">
          No red team analysis yet. Run an AI assessment and a sceptical VC will look for the fatal flaws in your plan.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {report.fatal_flaws.map((flaw, i) => (
            <li key={i} className="flex gap-3 rounded-xl bg-black/25 p-3.5">
              <Skull className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8fa3]" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs leading-relaxed font-semibold">{flaw.flaw}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                      flaw.severity === "high" ? "bg-danger text-white" : "bg-[#ffd27a] text-[#5c3d00]"
                    )}
                  >
                    {flaw.severity === "high" ? "High" : "Medium"}
                  </span>
                </div>
                {flaw.impact && <p className="mt-1 text-[11px] leading-relaxed text-[#e6b3bd]">Impact: {flaw.impact}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
