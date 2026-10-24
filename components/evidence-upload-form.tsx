"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { submitEvidence, type EvidenceResult } from "@/app/actions/upload";
import { EVIDENCE_TYPE_LABELS } from "@/lib/evidence";

export function EvidenceUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [response, setResponse] = useState<EvidenceResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setResponse(null);

    startTransition(async () => {
      const res = await submitEvidence(formData);
      setResponse(res);
      if (res.ok) {
        formRef.current?.reset();
        // Re-fetch the evidence list on the dashboard.
        router.refresh();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-extrabold">Upload Proof of your Business</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          A signed contract, an invoice or a bank statement proves your business is real and raises your score.
        </p>
      </div>
      <label htmlFor="evidence-type" className="sr-only">
        What kind of document is this?
      </label>
      <select
        id="evidence-type"
        name="evidence_type"
        required
        defaultValue=""
        disabled={isPending}
        className="min-h-[52px] w-full rounded-2xl border border-[#dce3ee] bg-white px-4 text-[15px] text-ink outline-none transition focus:border-[#fb923c] focus:shadow-[0_0_0_4px_#f973161a]"
      >
        <option value="" disabled>
          What kind of document is this?
        </option>
        {/* Submits the label (e.g. "Signed Contract"); the server action maps it to the stored key. */}
        {Object.entries(EVIDENCE_TYPE_LABELS).map(([key, label]) => (
          <option key={key} value={label}>
            {label}
          </option>
        ))}
      </select>
      <input
        id="evidence-file"
        name="file"
        type="file"
        required
        disabled={isPending}
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv"
        aria-describedby="evidence-file-hint"
        className="w-full min-w-0 rounded-2xl border-2 border-dashed border-[#dce3ee] bg-canvas p-3 text-sm text-muted file:mr-3 file:min-h-[40px] file:rounded-xl file:border-0 file:bg-white file:px-4 file:text-sm file:font-bold file:text-ink file:shadow-sm hover:file:bg-brand-soft"
      />
      <p id="evidence-file-hint" className="-mt-2 text-xs text-muted">
        PDF, photo, Word, Excel or CSV, up to 10 MB. Bank statements must be a PDF from your bank.
      </p>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-sm font-bold text-white shadow-brand transition hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto sm:self-start"
      >
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        {isPending ? "Uploading..." : "Upload Proof"}
      </button>

      {response?.ok && (
        <p className="flex items-start gap-2 text-sm leading-relaxed text-success" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {response.message}
        </p>
      )}
      {response && !response.ok && (
        <p className="flex items-start gap-2 text-sm leading-relaxed text-danger" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {response.error}
        </p>
      )}
    </form>
  );
}
