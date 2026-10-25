"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  FileText,
  FileWarning,
  Loader2,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { useAssessment } from "@/components/assessment-context";
import type { Assessment, Criterion } from "@/lib/claude";
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

// The input: describe or upload the business, then run the assessment. Results are shown by the page.
export function AssessmentForm() {
  const { assess, isPending } = useAssessment();
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

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-3">
          <label htmlFor="business-description" className="text-base font-bold text-ink">
            Describe your business
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

        <button
          type="submit"
          disabled={isPending || (!description.trim() && !planFile)}
          className={cn(primaryButton, "min-h-[60px] w-full bg-orange-500 text-base hover:bg-orange-600")}
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {isPending ? "Working on it..." : "Run AI Assessment"}
        </button>
      </form>

      <AssessmentStatus />
    </div>
  );
}

// The full breakdown of a result from this session: why the score is low, what was proven, and the 10
// criteria. Only this session's result has these details; the saved profile keeps the score and plan.
export function AssessmentBreakdown({ result }: { result: Assessment }) {
  return (
    <div className="flex flex-col gap-6">
      {!result.weaknesses.length || result.gate_status === "PASSED" ? null : (
        <section>
          <div className="mb-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-orange-500" />
            <div>
              <h3 className="text-base font-bold text-slate-800">Why your score is low</h3>
              <p className="text-xs text-gray-500">Fix these and your score goes up.</p>
            </div>
          </div>
          <ol className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
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
    </div>
  );
}

// Loading message while the AI works, and the error if the assessment couldn't run.
export function AssessmentStatus() {
  const { isPending, loadingMessage, response } = useAssessment();

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
  return null;
}

const FLAG_GROUPS = [
  {
    key: "verified_facts",
    title: "Proven by your documents",
    empty: "Nothing proven by documents yet.",
    icon: ShieldCheck,
    className: "border-gray-100 text-slate-700",
    iconClassName: "text-success",
  },
  {
    key: "reported_claims",
    title: "What you told us (not yet proven)",
    empty: "Nothing here.",
    icon: MessageSquareQuote,
    className: "border-gray-100 text-slate-700",
    iconClassName: "text-warning",
  },
  {
    key: "missing_evidence",
    title: "Documents to upload next",
    empty: "Nothing missing.",
    icon: FileWarning,
    className: "border-gray-100 text-slate-700",
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
                <span className="ml-auto rounded-full bg-gray-100 px-2 text-xs">{items.length}</span>
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
