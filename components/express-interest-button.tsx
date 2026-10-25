"use client";

import { useState, useTransition } from "react";
import { Check, HeartHandshake, Loader2 } from "lucide-react";
import { expressInterest } from "@/app/actions/interest";

export function ExpressInterestButton({ entrepreneurId, interested }: { entrepreneurId: string; interested: boolean }) {
  const [sent, setSent] = useState(interested);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await expressInterest(entrepreneurId);
      if (result.ok) setSent(true);
      else setError(result.error);
    });
  }

  if (sent) {
    return (
      <p className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
        <Check className="h-4 w-4" /> Interest sent
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <HeartHandshake className="h-4 w-4" />}
        Express Interest
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
