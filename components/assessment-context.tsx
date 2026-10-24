"use client";

import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runAssessment, type AssessmentResult } from "@/app/actions/assess";

// The server action is a single request, so these steps are paced on a timer to show progress.
const LOADING_STEPS = [
  { message: "Reading your document...", afterMs: 0 },
  { message: "Checking if it is a business plan...", afterMs: 2500 },
  { message: "Analyzing your business model...", afterMs: 6500 },
];

type AssessmentState = {
  assess: (submission: FormData) => void;
  // Runs the last submission again (e.g. after uploading proof in Step 2); null until something was submitted.
  rerun: (() => void) | null;
  isPending: boolean;
  loadingMessage: string | null;
  response: AssessmentResult | null;
  // The month the assessment ran against; the dashboard's month changes once a passed gate refreshes it.
  assessedMonth: number;
};

const AssessmentContext = createContext<AssessmentState | null>(null);

export function useAssessment(): AssessmentState {
  const value = useContext(AssessmentContext);
  if (!value) throw new Error("useAssessment must be used inside <AssessmentProvider>");
  return value;
}

export function AssessmentProvider({ currentMonth, children }: { currentMonth: number; children: React.ReactNode }) {
  const router = useRouter();
  const [lastSubmission, setLastSubmission] = useState<FormData | null>(null);
  const [response, setResponse] = useState<AssessmentResult | null>(null);
  const [assessedMonth, setAssessedMonth] = useState(currentMonth);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function assess(submission: FormData) {
    const hasFile = submission.get("business_plan") instanceof File;
    setResponse(null);
    setAssessedMonth(currentMonth);
    setLastSubmission(submission);

    // Typed text has no document to read, so it starts at the second step.
    timers.current.forEach(clearTimeout);
    const steps = hasFile ? LOADING_STEPS : LOADING_STEPS.slice(1);
    const offset = hasFile ? 0 : LOADING_STEPS[1].afterMs;
    setLoadingStep(LOADING_STEPS.indexOf(steps[0]));
    timers.current = steps
      .slice(1)
      .map((step) => setTimeout(() => setLoadingStep(LOADING_STEPS.indexOf(step)), step.afterMs - offset));

    startTransition(async () => {
      const res = await runAssessment(submission);
      timers.current.forEach(clearTimeout);
      setResponse(res);
      // Re-fetch the dashboard so the score banner, action plan and Tough Love card update.
      if (res.ok) router.refresh();
    });
  }

  return (
    <AssessmentContext.Provider
      value={{
        assess,
        rerun: lastSubmission ? () => assess(lastSubmission) : null,
        isPending,
        loadingMessage: isPending ? LOADING_STEPS[loadingStep].message : null,
        response,
        assessedMonth,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}
