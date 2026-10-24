"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, RefreshCw, Sparkles, XCircle } from "lucide-react";
import { runAssessment, type AssessmentResult } from "@/app/actions/assess";
import type { Assessment, ScoreBonus } from "@/lib/claude";
import { cn } from "@/lib/utils";

const SCORE_LABELS: Record<keyof Assessment["scores"], string> = {
  innovation: "Innovation",
  scalability: "Scalability",
  revenue_potential: "Revenue potential",
  profitability: "Profitability",
};

export function AssessmentForm({ currentMonth }: { currentMonth: number }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  // The description from the last run, so it can be re-assessed after evidence is uploaded.
  const [lastDescription, setLastDescription] = useState<string | null>(null);
  const [response, setResponse] = useState<AssessmentResult | null>(null);
  // The month the assessment ran against; the prop changes once the dashboard refreshes after a pass.
  const [assessedMonth, setAssessedMonth] = useState(currentMonth);
  const [isPending, startTransition] = useTransition();

  function assess(text: string) {
    setResponse(null);
    setAssessedMonth(currentMonth);
    setLastDescription(text);

    startTransition(async () => {
      const res = await runAssessment(text);
      setResponse(res);
      // Re-fetch the dashboard card so the new score (and month, on a pass) shows up.
      if (res.ok) router.refresh();
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    assess(description);
  }

  const result = response?.result;
  const evidenceBonus = response?.ok ? response.evidenceBonus : null;

  return (
    <section className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border p-6">
        <label htmlFor="business-description" className="font-semibold">
          Describe your business idea and current traction
        </label>
        <textarea
          id="business-description"
          required
          rows={7}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
          placeholder="What you sell, who buys it, how you charge, monthly revenue and customers so far…"
          className="resize-y rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50"
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {lastDescription && (
            <button
              type="button"
              onClick={() => assess(lastDescription)}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-indigo-300 bg-indigo-50 px-5 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Re-run AI Assessment after Evidence Upload
            </button>
          )}
          <button
            type="submit"
            disabled={isPending || !description.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            Run Assessment
          </button>
        </div>
      </form>

      {isPending && (
        <div className="flex items-center gap-3 rounded-xl border bg-zinc-50 p-6 text-sm text-zinc-700" role="status">
          <Loader2 className="h-5 w-5 animate-spin" />
          AI Auditor is analyzing your business...
        </div>
      )}

      {response && !response.ok && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {response.error}
        </div>
      )}

      {result && !isPending && (
        <AssessmentReport result={result} assessedMonth={assessedMonth} evidenceBonus={evidenceBonus} />
      )}
    </section>
  );
}

function AssessmentReport({
  result,
  assessedMonth,
  evidenceBonus,
}: {
  result: Assessment;
  assessedMonth: number;
  evidenceBonus: ScoreBonus | null;
}) {
  const passed = result.gate_status === "PASSED";

  return (
    <div className="flex flex-col gap-6">
      {passed ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <p className="text-lg font-semibold">
              {assessedMonth < 3
                ? `Gate Unlocked! You are now in Month ${assessedMonth + 1}`
                : "Final Gate Unlocked! You have completed the incubation programme"}
            </p>
            <p className="mt-1 text-sm text-emerald-800">{result.gate_feedback}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
          <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
          <div>
            <p className="text-lg font-semibold">Gate Locked: Month {assessedMonth}</p>
            <p className="mt-1 text-sm leading-relaxed text-red-800">{result.gate_feedback}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Assessment Scores</h2>
          <p className="text-2xl font-bold">
            {result.readiness_score}
            <span className="text-sm font-medium text-zinc-500">/100</span>
          </p>
        </div>
        {evidenceBonus && evidenceBonus.readiness > 0 && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Includes +{evidenceBonus.readiness} Readiness and +{evidenceBonus.scalability} Scalability (minimum{" "}
            {evidenceBonus.minScalability}) for verified evidence
          </p>
        )}
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {(Object.keys(SCORE_LABELS) as (keyof Assessment["scores"])[]).map((key) => {
            const score = result.scores[key];
            return (
              <div key={key}>
                <div className="flex justify-between text-sm">
                  <dt className="text-zinc-600">{SCORE_LABELS[key]}</dt>
                  <dd className="font-medium">{score}/10</dd>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-zinc-100">
                  <div
                    className={cn("h-1.5 rounded-full", score >= 6 ? "bg-emerald-500" : score >= 4 ? "bg-amber-500" : "bg-red-500")}
                    style={{ width: `${score * 10}%` }}
                  />
                </div>
              </div>
            );
          })}
        </dl>
      </div>

      {!passed && result.weaknesses.length > 0 && (
        <div className="rounded-xl border p-6">
          <h2 className="font-semibold">Weaknesses</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {result.weaknesses.map((weakness, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-zinc-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!passed && result.improvement_roadmap.length > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-6">
          <h2 className="font-semibold text-indigo-950">Improvement Roadmap</h2>
          <ol className="mt-4 flex flex-col gap-4">
            {result.improvement_roadmap.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-indigo-950">{step.action}</p>
                  <p className="mt-1 flex gap-1.5 text-sm text-indigo-800/80">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {step.reason}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
