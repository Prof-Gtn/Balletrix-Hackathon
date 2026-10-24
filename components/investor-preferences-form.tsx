"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Save } from "lucide-react";
import { saveInvestorPreferences, type PreferencesResult } from "@/app/actions/investor";
import { INSTRUMENTS, SECTORS, type Instrument } from "@/lib/investors";

export type InvestorPreferences = {
  preferred_sector: string;
  max_investment_amount: number;
  preferred_instrument: Instrument;
};

const inputClass =
  "h-[47px] w-full rounded-[11px] border border-[#dce3ee] bg-white px-3.5 text-[13px] text-ink outline-none transition placeholder:text-[#a2adbd] focus:border-[#8175fa] focus:shadow-[0_0_0_4px_#6557f51a] disabled:bg-canvas";

function Field({ label, id, hint, children }: { label: string; id: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-xs font-bold text-[#3c4a62]">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

export function InvestorPreferencesForm({ initial }: { initial: InvestorPreferences | null }) {
  const router = useRouter();
  const [response, setResponse] = useState<PreferencesResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setResponse(null);

    startTransition(async () => {
      const res = await saveInvestorPreferences(formData);
      setResponse(res);
      if (res.ok) router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <Field label="Preferred sector" id="preferred_sector">
        <select
          id="preferred_sector"
          name="preferred_sector"
          required
          defaultValue={initial?.preferred_sector ?? ""}
          disabled={isPending}
          className={inputClass}
        >
          <option value="" disabled>
            Select a sector…
          </option>
          {SECTORS.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Maximum investment (N$)" id="max_investment_amount" hint="The most you would put into a single business.">
        <input
          id="max_investment_amount"
          name="max_investment_amount"
          type="number"
          required
          min={0}
          step={1000}
          inputMode="numeric"
          placeholder="e.g. 250000"
          defaultValue={initial?.max_investment_amount ?? ""}
          disabled={isPending}
          className={inputClass}
        />
      </Field>

      <Field label="Preferred instrument" id="preferred_instrument">
        <select
          id="preferred_instrument"
          name="preferred_instrument"
          required
          defaultValue={initial?.preferred_instrument ?? ""}
          disabled={isPending}
          className={inputClass}
        >
          <option value="" disabled>
            Select debt or equity…
          </option>
          {Object.entries(INSTRUMENTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-[47px] w-full items-center justify-center gap-2 rounded-[11px] bg-brand px-[18px] text-sm font-semibold text-white shadow-brand transition hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {initial ? "Update preferences" : "Save preferences"}
      </button>

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
