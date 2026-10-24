"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  ChevronDown,
  FileText,
  FileWarning,
  Loader2,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import { useAssessment } from "@/components/assessment-context";
import { useWizard } from "@/components/dashboard-wizard";
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

export const primaryButton =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-sm font-bold text-white shadow-brand transition hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

// Step 1: describe or upload the business, run the assessment, and see the headline result.
export function AssessmentForm() {
  const { assess, isPending, response } = useAssessment();
  const wizard = useWizard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [planFile, setPlanFile] = useState<File | null>(null);

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
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-3">
          <label htmlFor="business-description" className="text-base font-bold text-ink">
            Step 1: Tell us about your business
          </label>
          <p className="text-sm leading-relaxed text-muted">
            What do you sell? Who buys it? How do you charge, and how much do you earn each month?
          </p>
          <textarea
            id="business-description"
            rows={7}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
            placeholder="For example: I sell kapana at the Single Quarters market, 6 days a week. About 120 customers a day spend N$35 each…"
            className={cn(
              "resize-y rounded-2xl border border-[#dce3ee] bg-white px-4 py-3.5 text-[15px] leading-relaxed outline-none transition placeholder:text-[#a2adbd] focus:border-[#fb923c] focus:shadow-[0_0_0_4px_#f973161a] disabled:bg-canvas",
              planFile && "opacity-50"
            )}
          />
        </div>

        <div className="grid gap-3">
          <label htmlFor="business-plan-file" className="text-sm font-bold text-ink">
            Or upload your business plan (PDF or Word)
          </label>
          <label
            htmlFor="business-plan-file"
            className={cn(
              "flex min-h-[72px] cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-3 transition",
              planFile ? "border-brand bg-brand-soft/50" : "border-[#dce3ee] bg-canvas hover:border-[#fdba74]",
              isPending && "pointer-events-none opacity-60"
            )}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-card">
              {planFile ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            </span>
            <span className="min-w-0 text-sm">
              <span className="block truncate font-bold text-ink">{planFile ? planFile.name : "Choose a file"}</span>
              <span className="block text-xs text-muted">
                {planFile ? "We'll read this file instead of the text above." : "PDF or Word (.docx), up to 10 MB"}
              </span>
            </span>
          </label>
          <input
            ref={fileInputRef}
            id="business-plan-file"
            type="file"
            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={isPending}
            onChange={(e) => setPlanFile(e.target.files?.[0] ?? null)}
            className="sr-only"
          />
          {planFile && (
            <button
              type="button"
              onClick={clearFile}
              disabled={isPending}
              className="justify-self-start text-sm font-semibold text-muted underline hover:text-ink"
            >
              Remove file
            </button>
          )}
        </div>

        <button type="submit" disabled={isPending || (!description.trim() && !planFile)} className={cn(primaryButton, "w-full sm:w-auto sm:self-start")}>
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {isPending ? "Working on it..." : "Run Assessment"}
        </button>
      </form>

      <AssessmentStatus />

      {result && !isPending && (
        <div className="flex flex-col gap-6 border-t border-line pt-8">
          <ResultSummary result={result} evidenceBonus={evidenceBonus} />

          {!result.weaknesses.length || result.gate_status === "PASSED" ? null : (
            <section className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white px-5 py-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-500 text-white">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Why your score is low</h3>
                  <p className="text-xs text-gray-500">Fix these and your score goes up.</p>
                </div>
              </div>
              <ol className="divide-y divide-gray-100">
                {result.weaknesses.map((weakness, i) => (
                  <li key={i} className="flex gap-4 px-5 py-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-50 text-xs font-bold text-orange-600">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="mb-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-600 uppercase">
                        {criterionLabel(weakness.criterion)}
                      </span>
                      <p className="text-sm leading-relaxed text-slate-700">{weakness.reason}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <EvidenceFlags flags={result.evidence_flags} />

          <AdvancedDetails result={result} />

          {wizard && (
            <button type="button" onClick={() => wizard.goTo(2)} className={cn(primaryButton, "w-full sm:w-auto sm:self-start")}>
              Next: See your action plan <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Loading message, error, and gate result banner. Shared by Step 1 and the "check again" button in Step 2.
export function AssessmentStatus({ showResult = false }: { showResult?: boolean }) {
  const { isPending, loadingMessage, response, assessedMonth } = useAssessment();

  if (isPending) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-brand-soft/70 px-5 py-4 text-[15px] font-semibold text-brand-dark" role="status" aria-live="polite">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
        {loadingMessage}
      </div>
    );
  }
  if (response && !response.ok) {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-danger-soft px-5 py-4 text-[15px] leading-relaxed text-[#9b2a3d]" role="alert">
        <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-danger" />
        {response.error}
      </div>
    );
  }
  if (showResult && response?.result) return <GateBanner result={response.result} assessedMonth={assessedMonth} />;
  return null;
}

function ResultSummary({ result, evidenceBonus }: { result: Assessment; evidenceBonus: ScoreBonus | null }) {
  const { assessedMonth } = useAssessment();
  const disqualified = result.gate_status === "DISQUALIFIED";

  return (
    <div className="flex flex-col gap-4">
      <GateBanner result={result} assessedMonth={assessedMonth} />
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-canvas px-5 py-4">
        <div>
          <p className="text-xs font-bold tracking-[1px] text-muted uppercase">Investment Readiness Score</p>
          <p className="text-[40px] leading-none font-extrabold tracking-[-1px]">
            {result.overall_score}
            <span className="text-lg font-semibold text-muted">/100</span>
          </p>
        </div>
        {!disqualified && evidenceBonus && evidenceBonus.readiness > 0 && (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-xs font-bold text-success">
            <CheckCircle2 className="h-4 w-4" />
            Includes +{evidenceBonus.readiness} for your checked documents
          </p>
        )}
      </div>
    </div>
  );
}

function GateBanner({ result, assessedMonth }: { result: Assessment; assessedMonth: number }) {
  if (result.gate_status === "DISQUALIFIED") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border-l-4 border-danger bg-navy p-5 text-white" role="alert">
        <Ban className="mt-0.5 h-6 w-6 shrink-0 text-danger" />
        <div>
          <p className="text-base font-bold">We can&apos;t score this yet: Month {assessedMonth} stays locked</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#c3ccdc]">{result.evidence_flags.disqualification_reason}</p>
          <p className="mt-2 text-xs text-[#8b98aa]">Fix the issue above and run the assessment again.</p>
        </div>
      </div>
    );
  }

  if (result.gate_status === "PASSED") {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-success-soft p-5 text-[#0a6b51]">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" />
        <div>
          <p className="text-base font-bold">
            {assessedMonth < 3
              ? `Gate Unlocked! You are now in Month ${assessedMonth + 1}`
              : "Final Gate Unlocked! You have completed the incubation programme"}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed">{result.gate_feedback}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-danger-soft p-5 text-[#9b2a3d]">
      <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-danger" />
      <div>
        <p className="text-base font-bold">Not yet: Month {assessedMonth} is still locked</p>
        <p className="mt-1.5 text-sm leading-relaxed">{result.gate_feedback}</p>
      </div>
    </div>
  );
}

const FLAG_GROUPS = [
  {
    key: "verified_facts",
    title: "Proven by your documents",
    empty: "Nothing proven by documents yet.",
    icon: ShieldCheck,
    className: "border-success/25 bg-success-soft text-[#0a6b51]",
    iconClassName: "text-success",
  },
  {
    key: "reported_claims",
    title: "What you told us (not yet proven)",
    empty: "Nothing here.",
    icon: MessageSquareQuote,
    className: "border-warning/25 bg-warning-soft text-[#7a5212]",
    iconClassName: "text-warning",
  },
  {
    key: "missing_evidence",
    title: "Documents to upload next",
    empty: "Nothing missing.",
    icon: FileWarning,
    className: "border-danger/25 bg-danger-soft text-[#9b2a3d]",
    iconClassName: "text-danger",
  },
] as const;

function EvidenceFlags({ flags }: { flags: Assessment["evidence_flags"] }) {
  return (
    <div>
      <h3 className="mb-3 text-base font-bold">What we could check</h3>
      <div className="grid gap-3">
        {FLAG_GROUPS.map(({ key, title, empty, icon: Icon, className, iconClassName }) => {
          const items = flags[key];
          return (
            <section key={key} className={cn("rounded-2xl border p-4", className)}>
              <h4 className="flex items-center gap-2 text-sm font-bold">
                <Icon className={cn("h-4 w-4", iconClassName)} />
                {title}
                <span className="ml-auto rounded-full bg-white/70 px-2 text-xs">{items.length}</span>
              </h4>
              {items.length ? (
                <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm opacity-75">{empty}</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function AdvancedDetails({ result }: { result: Assessment }) {
  return (
    <details className="group rounded-2xl border border-line">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-5 text-sm font-bold text-[#3c4a62] [&::-webkit-details-marker]:hidden">
        Advanced Details
        <ChevronDown className="h-5 w-5 text-muted transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-line px-5 pt-4 pb-5">
        <p className="mb-4 text-xs text-muted">Your score is the total of these 10 areas, each out of 10.</p>
        <dl className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
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
    </details>
  );
}
