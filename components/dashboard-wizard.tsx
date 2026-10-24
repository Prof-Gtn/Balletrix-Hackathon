"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStep = {
  title: string;
  subtitle: string;
  done?: boolean;
  // When set, the step can be opened but shows this explanation instead of its content.
  lockedMessage?: string;
  content: React.ReactNode;
};

const WizardContext = createContext<{ goTo: (step: number) => void } | null>(null);

// Lets a step's content move the user on, e.g. "Next: Fix & Prove".
export function useWizard() {
  return useContext(WizardContext);
}

const hashFor = (step: number) => `#step-${step}`;

function stepFromHash(count: number): number | null {
  const match = window.location.hash.match(/^#step-(\d)$/);
  const step = match ? Number(match[1]) : NaN;
  return step >= 1 && step <= count ? step : null;
}

// One step at a time. The active step lives in the URL hash (#step-2), so the sidebar links and the
// browser back button move between steps too.
export function DashboardWizard({ steps, initialStep }: { steps: WizardStep[]; initialStep: number }) {
  const [active, setActive] = useState(initialStep);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromHash = stepFromHash(steps.length);
    if (fromHash) setActive(fromHash);

    function onHashChange() {
      const step = stepFromHash(steps.length);
      if (!step) return;
      setActive(step);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [steps.length]);

  function goTo(step: number) {
    if (window.location.hash === hashFor(step)) setActive(step);
    else window.location.hash = hashFor(step);
  }

  const current = steps[active - 1];

  return (
    <WizardContext.Provider value={{ goTo }}>
      <div ref={topRef} className="scroll-mt-4">
        <nav aria-label="Steps" className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
          {steps.map((step, i) => {
            const number = i + 1;
            const isActive = number === active;
            return (
              <a
                key={number}
                href={hashFor(number)}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-center transition sm:flex-row sm:justify-start sm:gap-3 sm:px-4 sm:text-left",
                  isActive
                    ? "border-brand bg-white shadow-card"
                    : "border-transparent bg-white/60 hover:border-[#dcd8ff] hover:bg-white"
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold",
                    step.done ? "bg-success text-white" : isActive ? "bg-brand text-white" : "bg-[#eef0f6] text-muted"
                  )}
                >
                  {step.done ? <Check className="h-4 w-4" /> : step.lockedMessage ? <Lock className="h-4 w-4" /> : number}
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold tracking-[1px] text-muted uppercase">Step {number}</span>
                  <span className={cn("block text-[13px] font-bold sm:text-sm", isActive ? "text-ink" : "text-[#53627a]")}>
                    {step.title}
                  </span>
                </span>
              </a>
            );
          })}
        </nav>

        <section aria-labelledby="wizard-step-title" className="rounded-3xl border border-[#edf0f6] bg-white p-5 shadow-card sm:p-8">
          <header className="mb-7">
            <p className="text-xs font-bold tracking-[1px] text-brand uppercase">Step {active} of {steps.length}</p>
            <h2 id="wizard-step-title" className="mt-1 text-[22px] font-extrabold tracking-[-0.6px] sm:text-[26px]">
              {current.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{current.subtitle}</p>
          </header>

          {current.lockedMessage ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-canvas px-6 py-12 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-muted shadow-card">
                <Lock className="h-6 w-6" />
              </span>
              <p className="max-w-[420px] text-[15px] leading-relaxed font-semibold text-[#3c4a62]">{current.lockedMessage}</p>
              <button
                type="button"
                onClick={() => goTo(Math.max(1, active - 1))}
                className="min-h-[52px] rounded-2xl bg-brand px-6 text-sm font-bold text-white shadow-brand transition hover:brightness-105"
              >
                Back to Step {Math.max(1, active - 1)}
              </button>
            </div>
          ) : (
            current.content
          )}
        </section>
      </div>
    </WizardContext.Provider>
  );
}
