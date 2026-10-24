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
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="evidence-file" className="text-xs font-bold text-[#3c4a62]">
        Upload Evidence (Contracts, Invoices, Bank Statements)
      </label>
      <select
        name="evidence_type"
        required
        defaultValue=""
        disabled={isPending}
        aria-label="Evidence type"
        className="h-[42px] w-full rounded-[11px] border border-[#dce3ee] bg-white px-3 text-[13px] text-ink outline-none transition focus:border-[#8175fa] focus:shadow-[0_0_0_4px_#6557f51a]"
      >
        <option value="" disabled>
          Select evidence type…
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
        className="w-full min-w-0 rounded-[11px] border border-dashed border-[#dce3ee] bg-canvas p-2 text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink file:shadow-sm hover:file:bg-brand-soft"
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[11px] bg-brand px-[18px] text-xs font-semibold text-white shadow-brand transition hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {isPending ? "Uploading..." : "Submit Evidence"}
      </button>
      <p className="text-[11px] text-muted">PDF, image, Word, Excel or CSV, up to 10 MB.</p>

      {response?.ok && (
        <p className="flex items-start gap-2 text-xs text-success" role="status">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {response.message}
        </p>
      )}
      {response && !response.ok && (
        <p className="flex items-start gap-2 text-xs text-danger" role="alert">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {response.error}
        </p>
      )}
    </form>
  );
}
