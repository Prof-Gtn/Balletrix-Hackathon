"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Calculator, Loader2, Sparkles } from "lucide-react";
import { calculateValuation, type ValuationResult } from "@/app/actions/valuation";
import { formatNad } from "@/lib/investors";

const YEARS = [1, 2, 3] as const;

const inputClass =
  "h-[47px] w-full rounded-[11px] border border-[#dce3ee] bg-white pr-3.5 pl-11 text-[13px] text-ink outline-none transition placeholder:text-[#a2adbd] focus:border-[#8175fa] focus:shadow-[0_0_0_4px_#6557f51a] disabled:bg-canvas";

// 0.255 -> "25.5"
const percent = (rate: number) => String(Math.round(rate * 1000) / 10);

export function DCFCalculator() {
  const [cashFlows, setCashFlows] = useState<string[]>(["", "", ""]);
  const [response, setResponse] = useState<ValuationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResponse(null);
    startTransition(async () => {
      setResponse(await calculateValuation(cashFlows.map(Number)));
    });
  }

  const result = response?.ok ? response.result : null;

  return (
    <div className="grid gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs leading-relaxed text-muted">
          Enter your projected free cash flow for the next three years. The AI suggests a discount rate and long-term growth
          rate from your readiness score and sector.
        </p>
        <div className="grid gap-3 sm:grid-cols-3 min-[1100px]:grid-cols-1">
          {YEARS.map((year, i) => (
            <div key={year} className="grid gap-2">
              <label htmlFor={`fcf-${year}`} className="text-xs font-bold text-[#3c4a62]">
                Year {year} free cash flow
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-semibold text-muted">
                  N$
                </span>
                <input
                  id={`fcf-${year}`}
                  type="number"
                  required
                  step="any"
                  inputMode="decimal"
                  placeholder={["50000", "120000", "200000"][i]}
                  value={cashFlows[i]}
                  onChange={(e) => setCashFlows((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
                  disabled={isPending}
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-[47px] items-center justify-center gap-2 rounded-[11px] bg-brand px-[18px] text-xs font-semibold text-white shadow-brand transition hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
          {isPending ? "Calculating..." : "Calculate Valuation"}
        </button>
        {response && !response.ok && (
          <p className="flex items-start gap-2 text-xs text-danger" role="alert">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {response.error}
          </p>
        )}
      </form>

      <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-[#151d35] p-[22px] text-white">
        <div aria-hidden className="absolute right-[18px] -bottom-3 rotate-[-15deg] text-[70px] font-black opacity-[0.12]">
          N$
        </div>
        {isPending ? (
          <div className="flex items-center gap-3 text-[13px] text-[#c3c8dd]" role="status">
            <Loader2 className="h-5 w-5 animate-spin" />
            AI is suggesting valuation rates...
          </div>
        ) : result ? (
          <>
            <div>
              <p className="text-[11px] tracking-[1.2px] text-[#a99aff] uppercase">Estimated valuation</p>
              <p className="mt-1 text-[clamp(30px,4vw,42px)] font-extrabold tracking-[-1px]">{formatNad(result.valuation)}</p>
              {result.valuation < 0 && (
                <p className="text-[11px] text-[#ffb3c0]">Negative: the projected cash flows destroy value at this discount rate.</p>
              )}
            </div>

            <dl className="relative my-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:grid-cols-4">
              {result.presentValues.map((pv, i) => (
                <div key={i}>
                  <dt className="text-[#8b98aa]">PV year {i + 1}</dt>
                  <dd className="font-semibold">{formatNad(pv)}</dd>
                </div>
              ))}
              <div>
                <dt className="text-[#8b98aa]">PV terminal</dt>
                <dd className="font-semibold">{formatNad(result.presentTerminalValue)}</dd>
              </div>
            </dl>

            <p className="relative rounded-xl bg-white/[0.06] p-3.5 text-[11px] leading-[1.6] text-[#c3c8dd]">
              <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-brand-light" />
              AI-suggested discount rate: {percent(result.rates.discount_rate)}%, growth rate:{" "}
              {percent(result.rates.terminal_growth_rate)}%. Reasoning: {result.rates.reasoning}
            </p>
            <p className="relative mt-2 text-[10px] text-[#8b98aa]">
              Based on a readiness score of {result.readinessScore}/100 in {result.sector}. An estimate, not financial advice.
            </p>
          </>
        ) : (
          <div className="relative">
            <p className="text-[11px] tracking-[1.2px] text-[#a99aff] uppercase">Estimated valuation</p>
            <p className="mt-1 text-[clamp(30px,4vw,42px)] font-extrabold tracking-[-1px] text-white/30">N$ —</p>
            <p className="mt-3 max-w-[300px] text-[11px] leading-[1.6] text-[#c3c8dd]">
              Your valuation will appear here, with the rates the AI used and why.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
