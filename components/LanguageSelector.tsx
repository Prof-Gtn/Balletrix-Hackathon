"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2 } from "lucide-react";
import { setPreferredLanguage } from "@/app/actions/language";
import { LANGUAGES, type Language } from "@/lib/languages";
import { cn } from "@/lib/utils";

// Chooses the language the AI writes in (assessments, Tough Love and memos). "light" for white
// headers, "dark" for the navy landing page bar.
export function LanguageSelector({ initial, tone = "light" }: { initial: Language; tone?: "light" | "dark" }) {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(next: Language) {
    const previous = language;
    setLanguage(next);
    setError(null);
    startTransition(async () => {
      const result = await setPreferredLanguage(next);
      if (!result.ok) {
        setLanguage(previous);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const Icon = pending ? Loader2 : Globe;

  return (
    <label
      title={error ?? "Language for AI feedback"}
      className={cn(
        "relative flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-sm transition",
        tone === "dark" ? "border-white/20 text-gray-200 hover:border-white/40" : "border-gray-200 text-slate-700 hover:bg-slate-50",
        error && "border-red-400"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", pending && "animate-spin", tone === "dark" ? "text-gray-300" : "text-gray-400")} />
      <span className="sr-only">Language</span>
      <select
        value={language}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as Language)}
        className={cn(
          "cursor-pointer appearance-none bg-transparent pr-1 font-medium outline-none disabled:cursor-wait",
          tone === "dark" && "[&>option]:text-slate-800"
        )}
      >
        {LANGUAGES.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
