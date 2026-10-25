"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2, PencilLine, RefreshCw } from "lucide-react";
import { ActionPlan } from "@/components/action-plan";
import { useAssessment } from "@/components/assessment-context";
import { AssessmentBreakdown, AssessmentForm, AssessmentStatus } from "@/components/assessment-form";
import { GLOSSARY, InfoTip } from "@/components/info-tip";
import type { Assessment } from "@/lib/claude";
import { GATE_REQUIREMENTS, toIncubationMonth } from "@/lib/gates";
import { cn } from "@/lib/utils";

export type GateStatus = Assessment["gate_status"];
// The latest saved assessment, read from evidence_submissions on the server.
export type LastGate = { status: GateStatus; month: number; feedback: string | null };

// The Assessment page has two states. Before any assessment: only the input card. After one: the score
// and action plan on the left, Tough Love and evidence upload on the right. Server-rendered cards are
// passed in as slots so they keep loading their own data.
export function AssessmentWorkspace({
  hasAssessment,
  score,
  month,
  lastGate,
  savedRoadmap,
  toughLove,
  evidence,
  funding,
}: {
  hasAssessment: boolean;
  score: number;
  month: number;
  lastGate: LastGate | null;
  savedRoadmap: unknown;
  toughLove: React.ReactNode;
  evidence: React.ReactNode;
  funding?: React.ReactNode;
}) {
  const { response, isPending, rerun, assessedMonth } = useAssessment();
  const fresh = response?.ok ? response.result : null;
  const [editing, setEditing] = useState(false);

  // A successful run from the input card switches back to the results.
  useEffect(() => {
    if (response?.ok) setEditing(false);
  }, [response]);

  const showResults = (hasAssessment || Boolean(fresh)) && !editing;

  if (!showResults) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">Let&apos;s assess your business.</h2>
        <p className="mt-2 mb-8 leading-relaxed text-gray-500">
          Tell us what you do, or upload your business plan. Our AI will score it against 10 investor criteria and tell you
          exactly how to improve.
        </p>
        <AssessmentForm />
        {editing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={isPending}
            className="mt-6 text-sm font-semibold text-gray-500 underline hover:text-slate-800"
          >
            Cancel and go back to my results
          </button>
        )}
      </section>
    );
  }

  const gate: LastGate | null = fresh
    ? { status: fresh.gate_status, month: assessedMonth, feedback: fresh.gate_feedback }
    : lastGate;
  const bonus = response?.ok && fresh?.gate_status !== "DISQUALIFIED" ? response.evidenceBonus.readiness : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        {/* Left: score, gate and the action plan */}
        <div className="flex flex-col gap-8">
          <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <p className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
              Investment Readiness Score <InfoTip text={GLOSSARY.readinessScore} label="Readiness Score" />
            </p>
            <p className="mt-2 text-6xl leading-none font-extrabold tracking-tight text-slate-800">
              {fresh ? fresh.overall_score : score}
              <span className="text-2xl font-semibold text-gray-400">/100</span>
            </p>
            {bonus > 0 && <p className="mt-3 text-sm text-gray-500">Includes +{bonus} for your checked documents.</p>}

            <div className="mt-8 border-t border-gray-100 pt-6">
              <p className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                Gate Status <InfoTip text={GLOSSARY.gate} label="Gate" />
              </p>
              {gate ? <GateLine gate={gate} /> : <p className="mt-2 text-sm text-gray-500">Run an assessment to check your gate.</p>}
              <p className="mt-4 text-sm text-gray-500">
                You&apos;re in <b className="text-slate-800">Month {month} of 3</b>. To pass this month&apos;s gate you need{" "}
                {GATE_REQUIREMENTS[toIncubationMonth(month)].sentence}.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {rerun && (
                <button
                  type="button"
                  onClick={rerun}
                  disabled={isPending}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Check my business again
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={isPending}
                className={cn(
                  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition disabled:opacity-60",
                  rerun
                    ? "border border-gray-200 text-slate-700 hover:bg-slate-50"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                )}
              >
                <PencilLine className="h-4 w-4" /> {rerun ? "Assess an updated plan" : "Run a new assessment"}
              </button>
            </div>
            {!rerun && (
              <p className="mt-3 text-xs text-gray-500">Uploaded new proof? Run the assessment again so your score includes it.</p>
            )}
            <div className="mt-4">
              <AssessmentStatus />
            </div>
          </section>

          <ActionPlan saved={savedRoadmap} />

          {fresh && (
            <details className="group rounded-2xl border border-gray-100 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-8 text-base font-bold text-slate-800 [&::-webkit-details-marker]:hidden">
                See the full breakdown
                <ChevronDown className="h-5 w-5 text-gray-400 transition group-open:rotate-180" />
              </summary>
              <div className="px-8 pb-8">
                <AssessmentBreakdown result={fresh} />
              </div>
            </details>
          )}
        </div>

        {/* Right: what an investor will worry about, and where to upload proof */}
        <div className="flex flex-col gap-8">
          {toughLove}
          {evidence}
        </div>
      </div>

      {funding}
    </div>
  );
}

const GATE_LABELS: Record<GateStatus, { label: string; dot: string; text: string }> = {
  PASSED: { label: "Passed", dot: "bg-emerald-500", text: "text-emerald-700" },
  FAILED: { label: "Not passed yet", dot: "bg-orange-500", text: "text-orange-700" },
  DISQUALIFIED: { label: "Can't be scored yet", dot: "bg-red-500", text: "text-red-700" },
};

function GateLine({ gate }: { gate: LastGate }) {
  const style = GATE_LABELS[gate.status];
  return (
    <div className="mt-2">
      <p className={cn("flex items-center gap-2 text-lg font-bold", style.text)}>
        <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} aria-hidden />
        Month {gate.month} gate: {style.label}
      </p>
      {gate.feedback && <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{gate.feedback}</p>}
    </div>
  );
}
