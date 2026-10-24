"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  CircleHelp,
  FileText,
  FileWarning,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { runAssessment, type AssessmentResult } from "@/app/actions/assess";
import type { Assessment, Criterion, ScoreBonus } from "@/lib/claude";
import { cn } from "@/lib/utils";

const CRITERIA_LABELS: Record<Criterion, string> = {
  innovation: "Innovation",
  market: "Market",
  scalability: "Scalability",
  revenue: "Revenue",
  profitability: "Profitability",
  competitive_advantage: "Competitive advantage",
  customer_validation: "Customer validation",
  financial_viability: "Financial viability",
  execution: "Execution",
  investment_readiness: "Investment readiness",
};

// The model names the criterion for each weakness; show the label when it matches a known key.
function criterionLabel(value: string): string {
  return CRITERIA_LABELS[value as Criterion] ?? value.replace(/_/g, " ");
}

export function AssessmentForm({ currentMonth }: { currentMonth: number }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [planFile, setPlanFile] = useState<File | null>(null);
  // The last submission (text or file), so it can be re-assessed after evidence is uploaded.
  const [lastSubmission, setLastSubmission] = useState<FormData | null>(null);
  const [response, setResponse] = useState<AssessmentResult | null>(null);
  // The month the assessment ran against; the prop changes once the dashboard refreshes after a pass.
  const [assessedMonth, setAssessedMonth] = useState(currentMonth);
  const [isPending, startTransition] = useTransition();

  function assess(submission: FormData) {
    setResponse(null);
    setAssessedMonth(currentMonth);
    setLastSubmission(submission);

    startTransition(async () => {
      const res = await runAssessment(submission);
      setResponse(res);
      // Re-fetch the dashboard card so the new score (and month, on a pass) shows up.
      if (res.ok) router.refresh();
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const submission = new FormData();
    submission.append("description", description);
    // The server action uses the file instead of the text when one is attached.
    if (planFile) submission.append("business_plan", planFile);
    assess(submission);
  }

  function clearFile() {
    setPlanFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const result = response?.result;
  const evidenceBonus = response?.ok ? response.evidenceBonus : null;

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="business-description" className="text-xs font-bold text-[#3c4a62]">
          Describe your business idea and current traction
        </label>
        <textarea
          id="business-description"
          rows={7}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
          placeholder="What you sell, who buys it, how you charge, monthly revenue and customers so far…"
          className={cn(
            "resize-y rounded-[11px] border border-[#dce3ee] bg-white px-3.5 py-3 text-[13px] leading-relaxed outline-none transition placeholder:text-[#a2adbd] focus:border-[#8175fa] focus:shadow-[0_0_0_4px_#6557f51a] disabled:bg-canvas",
            planFile && "opacity-60"
          )}
        />

        <div className="grid gap-2">
          <label htmlFor="business-plan-file" className="text-xs font-bold text-[#3c4a62]">
            Or upload your business plan (PDF or Word)
          </label>
          <input
            ref={fileInputRef}
            id="business-plan-file"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf"
            disabled={isPending}
            onChange={(e) => setPlanFile(e.target.files?.[0] ?? null)}
            className="w-full min-w-0 rounded-[11px] border border-dashed border-[#dce3ee] bg-canvas p-2 text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink file:shadow-sm hover:file:bg-brand-soft"
          />
          {planFile && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-brand-dark">
              <FileText className="h-3.5 w-3.5" />
              We&apos;ll read <b className="font-semibold">{planFile.name}</b> instead of the text above.
              <button type="button" onClick={clearFile} disabled={isPending} className="font-semibold text-muted underline hover:text-ink">
                Remove file
              </button>
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          {lastSubmission && (
            <button
              type="button"
              onClick={() => assess(lastSubmission)}
              disabled={isPending}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[11px] border border-[#d9d4ff] bg-brand-soft px-4 text-xs font-semibold text-brand-dark transition hover:bg-[#e4e0ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Re-run AI Assessment after Evidence Upload
            </button>
          )}
          <button
            type="submit"
            disabled={isPending || (!description.trim() && !planFile)}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[11px] bg-brand px-[18px] text-xs font-semibold text-white shadow-brand transition hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <Sparkles className="h-4 w-4" />
            Run Assessment
          </button>
        </div>
      </form>

      {isPending && (
        <div className="flex items-center gap-3 rounded-xl bg-brand-soft/60 p-4 text-[13px] text-brand-dark" role="status">
          <Loader2 className="h-5 w-5 animate-spin" />
          AI Auditor is analyzing your business...
        </div>
      )}

      {response && !response.ok && (
        <div className="flex items-start gap-3 rounded-xl bg-danger-soft p-4 text-[13px] text-danger" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {response.error}
        </div>
      )}

      {result && !isPending && <AssessmentReport result={result} assessedMonth={assessedMonth} evidenceBonus={evidenceBonus} />}
    </div>
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
  const disqualified = result.gate_status === "DISQUALIFIED";

  return (
    <div className="flex flex-col gap-5 border-t border-line pt-5">
      <GateBanner result={result} assessedMonth={assessedMonth} />

      <EvidenceFlags flags={result.evidence_flags} />

      <div>
        <div className="flex items-baseline justify-between">
          <h4 className="text-sm font-bold">Criteria scores</h4>
          <p className="text-[25px] font-extrabold tracking-[-0.4px]">
            {result.overall_score}
            <span className="text-xs font-medium text-muted">/100</span>
          </p>
        </div>
        {!disqualified && evidenceBonus && evidenceBonus.readiness > 0 && (
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Includes +{evidenceBonus.readiness} Readiness and +{evidenceBonus.scalability} Scalability (minimum{" "}
            {evidenceBonus.minScalability}) for verified evidence
          </p>
        )}
        <dl className="mt-4 grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
          {(Object.keys(CRITERIA_LABELS) as Criterion[]).map((key) => {
            const score = result.criteria_scores[key];
            return (
              <div key={key}>
                <div className="flex justify-between text-xs">
                  <dt className="text-[#64728a]">{CRITERIA_LABELS[key]}</dt>
                  <dd className="font-bold">{score}/10</dd>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-[#f0f2f7]">
                  <div
                    className={cn("h-1.5 rounded-full", score >= 6 ? "bg-success" : score >= 4 ? "bg-brand" : "bg-danger")}
                    style={{ width: `${score * 10}%` }}
                  />
                </div>
              </div>
            );
          })}
        </dl>
      </div>

      {!passed && result.weaknesses.length > 0 && (
        <div>
          <h4 className="text-sm font-bold">Weaknesses</h4>
          <ul className="mt-3 flex flex-col gap-3">
            {result.weaknesses.map((weakness, i) => (
              <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-[#3c4a62]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                <span>
                  <span className="mr-1.5 inline-block rounded-md bg-canvas px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink uppercase">
                    {criterionLabel(weakness.criterion)}
                  </span>
                  {weakness.reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!passed && result.roadmap.length > 0 && (
        <div className="rounded-2xl bg-[#151d35] p-5 text-white">
          <h4 className="text-sm font-bold">Improvement Roadmap</h4>
          <ol className="mt-4 flex flex-col gap-4">
            {result.roadmap.map((step, i) => (
              <li key={i} className="flex gap-3.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] bg-brand text-xs font-bold">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-xs leading-relaxed font-semibold">{step.action}</p>
                  <p className="mt-1 flex gap-1.5 text-[11px] leading-relaxed text-[#c3c8dd]">
                    <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-brand-light" />
                    {step.why}
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

function GateBanner({ result, assessedMonth }: { result: Assessment; assessedMonth: number }) {
  if (result.gate_status === "DISQUALIFIED") {
    return (
      <div className="flex items-start gap-3 rounded-xl border-l-4 border-danger bg-navy p-4 text-white" role="alert">
        <Ban className="mt-0.5 h-6 w-6 shrink-0 text-danger" />
        <div>
          <p className="text-[15px] font-bold">Disqualified: Month {assessedMonth} gate locked</p>
          <p className="mt-1 text-xs leading-relaxed text-[#c3ccdc]">{result.evidence_flags.disqualification_reason}</p>
          <p className="mt-2 text-[11px] text-[#8b98aa]">No evidence bonus was applied. Resolve the issue above before resubmitting.</p>
        </div>
      </div>
    );
  }

  if (result.gate_status === "PASSED") {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-success-soft p-4 text-[#0a6b51]">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" />
        <div>
          <p className="text-[15px] font-bold">
            {assessedMonth < 3
              ? `Gate Unlocked! You are now in Month ${assessedMonth + 1}`
              : "Final Gate Unlocked! You have completed the incubation programme"}
          </p>
          <p className="mt-1 text-xs leading-relaxed">{result.gate_feedback}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl bg-danger-soft p-4 text-[#9b2a3d]">
      <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-danger" />
      <div>
        <p className="text-[15px] font-bold">Gate Locked: Month {assessedMonth}</p>
        <p className="mt-1 text-xs leading-relaxed">{result.gate_feedback}</p>
      </div>
    </div>
  );
}

const FLAG_GROUPS = [
  {
    key: "verified_facts",
    title: "Verified facts",
    empty: "No verified evidence yet.",
    icon: ShieldCheck,
    className: "border-success/25 bg-success-soft text-[#0a6b51]",
    iconClassName: "text-success",
  },
  {
    key: "reported_claims",
    title: "Reported claims",
    empty: "No unverified claims.",
    icon: MessageSquareQuote,
    className: "border-warning/25 bg-warning-soft text-[#7a5212]",
    iconClassName: "text-warning",
  },
  {
    key: "missing_evidence",
    title: "Missing evidence",
    empty: "Nothing missing.",
    icon: FileWarning,
    className: "border-danger/25 bg-danger-soft text-[#9b2a3d]",
    iconClassName: "text-danger",
  },
] as const;

function EvidenceFlags({ flags }: { flags: Assessment["evidence_flags"] }) {
  return (
    <div className="rounded-2xl border border-line p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
        <CircleHelp className="h-4 w-4 text-brand" />
        Evidence check
      </h4>
      <div className="grid gap-3 min-[1400px]:grid-cols-3">
        {FLAG_GROUPS.map(({ key, title, empty, icon: Icon, className, iconClassName }) => {
          const items = flags[key];
          return (
            <section key={key} className={cn("rounded-xl border p-3.5", className)}>
              <h5 className="flex items-center gap-1.5 text-xs font-bold">
                <Icon className={cn("h-3.5 w-3.5", iconClassName)} />
                {title}
                <span className="ml-auto rounded-full bg-white/70 px-1.5 text-[10px]">{items.length}</span>
              </h5>
              {items.length ? (
                <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-[11px] leading-relaxed">
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[11px] opacity-75">{empty}</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
