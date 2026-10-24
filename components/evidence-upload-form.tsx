"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { submitEvidence, type EvidenceResult } from "@/app/actions/upload";

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
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border p-6">
      <label htmlFor="evidence-file" className="font-semibold">
        Upload Evidence (Contracts, Invoices, Bank Statements)
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          id="evidence-file"
          name="file"
          type="file"
          required
          disabled={isPending}
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv"
          className="min-w-0 flex-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-zinc-200"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isPending ? "Uploading..." : "Submit Evidence"}
        </button>
      </div>
      <p className="text-xs text-zinc-500">PDF, image, Word, Excel or CSV, up to 10 MB.</p>

      {response?.ok && (
        <p className="flex items-start gap-2 text-sm text-emerald-700" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {response.message}
        </p>
      )}
      {response && !response.ok && (
        <p className="flex items-start gap-2 text-sm text-red-700" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {response.error}
        </p>
      )}
    </form>
  );
}
