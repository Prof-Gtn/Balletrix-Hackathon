"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2 } from "lucide-react";
import { overrideAndVerify } from "@/app/actions/admin";

export function OverrideVerifyButton({ evidenceId }: { evidenceId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await overrideAndVerify(evidenceId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white transition hover:bg-emerald-600 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
        Override &amp; Verify
      </button>
      {error && (
        <p role="alert" className="max-w-48 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
