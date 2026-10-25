"use client";

import { ListChecks } from "lucide-react";
import { useAssessment } from "@/components/assessment-context";

type Step = { action: string; why: string };

// Reads profiles.roadmap defensively: null or malformed data shows the empty state instead of crashing.
function parseRoadmap(value: unknown): Step[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === "object")
    .map((s) => ({
      action: typeof s.action === "string" ? s.action.trim() : "",
      why: typeof s.why === "string" ? s.why.trim() : "",
    }))
    .filter((s) => s.action);
}

// "Your Action Plan": the latest assessment's roadmap as a numbered checklist. Prefers this session's
// fresh result, then the saved one.
export function ActionPlan({ saved }: { saved: unknown }) {
  const { response } = useAssessment();
  const steps = response?.result ? response.result.roadmap : parseRoadmap(saved);

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
        <ListChecks className="h-5 w-5 text-orange-500" /> Your Action Plan
      </h2>
      {!steps.length ? (
        <p className="mt-3 text-sm leading-relaxed text-gray-500">Your action plan will appear here after your first assessment.</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-gray-500">Start at the top. Each step moves your score up.</p>
          <ol className="mt-6 flex flex-col gap-5">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-orange-500 text-sm font-bold text-orange-600">
                  {i + 1}
                </span>
                <div className="min-w-0 pt-1">
                  <p className="text-[15px] leading-relaxed font-semibold text-slate-800">{step.action}</p>
                  {step.why && <p className="mt-1 text-sm leading-relaxed text-gray-500">{step.why}</p>}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
