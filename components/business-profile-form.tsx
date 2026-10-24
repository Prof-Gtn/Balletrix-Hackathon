"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { saveBusinessProfile } from "@/app/actions/profile";
import { SECTORS } from "@/lib/investors";

export type BusinessProfile = {
  business_name: string;
  sector: string;
  target_market: string;
  business_description: string;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50";

function Field({ label, id, hint, children }: { label: string; id: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// Onboarding (with target market, then on to the dashboard) and the Business Profile page (saves in place).
export function BusinessProfileForm({
  initial,
  showTargetMarket,
  submitLabel,
  redirectTo,
}: {
  initial: Partial<BusinessProfile>;
  showTargetMarket: boolean;
  submitLabel: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const res = await saveBusinessProfile(formData);
      if (!res.ok) return setError(res.error);
      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Business Name" id="business_name">
        <input
          id="business_name"
          name="business_name"
          required
          maxLength={120}
          defaultValue={initial.business_name ?? ""}
          placeholder="e.g. Kapana Kings"
          disabled={isPending}
          className={inputClass}
        />
      </Field>

      <Field label="Sector" id="sector">
        <select id="sector" name="sector" required defaultValue={initial.sector ?? ""} disabled={isPending} className={inputClass}>
          <option value="" disabled>
            Choose your sector
          </option>
          {SECTORS.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </Field>

      {showTargetMarket && (
        <Field label="Target Market" id="target_market" hint="Who are your customers? For example: office workers in Windhoek CBD.">
          <input
            id="target_market"
            name="target_market"
            required
            maxLength={300}
            defaultValue={initial.target_market ?? ""}
            placeholder="Who buys from you?"
            disabled={isPending}
            className={inputClass}
          />
        </Field>
      )}

      <Field label="Brief Description" id="business_description" hint="What you sell, who buys it, and how you make money.">
        <textarea
          id="business_description"
          name="business_description"
          required
          rows={5}
          maxLength={5000}
          defaultValue={initial.business_description ?? ""}
          placeholder="Tell us about your business in a few sentences…"
          disabled={isPending}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-8"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> Your business profile has been saved.
        </p>
      )}
    </form>
  );
}
