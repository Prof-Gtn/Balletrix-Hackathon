"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useAssessment } from "@/components/assessment-context";
import { AssessmentStatus, primaryButton } from "@/components/assessment-form";
import { useWizard } from "@/components/dashboard-wizard";
import { cn } from "@/lib/utils";

// Step 2: after uploading proof, check the business again with the same description or document.
export function RerunAssessment() {
  const { rerun, isPending } = useAssessment();
  const wizard = useWizard();

  return (
    <div className="flex flex-col gap-4 rounded-3xl border-2 border-[#fed7aa] bg-brand-soft/40 p-5 sm:p-7">
      <div>
        <h3 className="text-lg font-extrabold">Uploaded new proof?</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Check your business again so your score includes your checked documents.
        </p>
      </div>
      {rerun ? (
        <button type="button" onClick={rerun} disabled={isPending} className={cn(primaryButton, "w-full sm:w-auto sm:self-start")}>
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          Check My Business Again
        </button>
      ) : (
        <button
          type="button"
          onClick={() => wizard?.goTo(1)}
          className={cn(primaryButton, "w-full bg-white text-brand-dark shadow-none sm:w-auto sm:self-start")}
        >
          Go to Step 1 to run your assessment
        </button>
      )}
      <AssessmentStatus showResult />
    </div>
  );
}
