"use client";

import { ArrowRight, ListChecks } from "lucide-react";
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

// "Your Action Plan": the latest assessment's roadmap. Prefers this session's fresh result, then the saved one.
export function ActionPlan({ saved }: { saved: unknown }) {
  const { response } = useAssessment();
  const steps = response?.result ? response.result.roadmap : parseRoadmap(saved);

  return (
    <section className="rounded-3xl bg-[#1a202c] p-5 text-white sm:p-7">
      <h3 className="flex items-center gap-2 text-lg font-extrabold">
        <ListChecks className="h-5 w-5 text-brand-light" /> Your Action Plan
      </h3>
      {!steps.length ? (
        <p className="mt-3 text-sm leading-relaxed text-[#c3c8dd]">
          Your action plan will appear here after you run your assessment in Step 1.
        </p>
      ) : (
        <ol className="mt-5 flex flex-col gap-5">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-sm font-extrabold">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-[15px] leading-relaxed font-bold">{step.action}</p>
                {step.why && (
                  <p className="mt-1.5 flex gap-2 text-sm leading-relaxed text-[#c3c8dd]">
                    <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-light" />
                    {step.why}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
