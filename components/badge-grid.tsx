"use client";

import { useState } from "react";
import { Award, CheckCircle2, Lock } from "lucide-react";
import type { Badge } from "@/lib/gamification";
import { cn } from "@/lib/utils";

// Six clickable badge cards. Clicking one reveals how to earn it; locked badges show their progress.
export function BadgeGrid({ badges }: { badges: Badge[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {badges.map((badge) => {
        const isOpen = open === badge.id;
        const percent = Math.round((badge.current / badge.target) * 100);
        return (
          <li key={badge.id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : badge.id)}
              aria-expanded={isOpen}
              className={cn(
                "flex h-full w-full flex-col rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none",
                badge.earned ? "border-yellow-200" : "border-gray-100",
                isOpen && "ring-2 ring-orange-500"
              )}
            >
              <div className="flex items-start gap-4">
                <span
                  className={cn(
                    "grid h-14 w-14 shrink-0 place-items-center rounded-full",
                    badge.earned ? "bg-gradient-to-br from-yellow-300 to-orange-500 text-white shadow-md" : "bg-gray-100 text-gray-400"
                  )}
                >
                  {badge.earned ? <Award className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("font-bold", badge.earned ? "text-slate-800" : "text-gray-500")}>{badge.name}</p>
                  <p className={cn("mt-0.5 text-sm", badge.earned ? "text-gray-600" : "text-gray-400")}>{badge.description}</p>
                </div>
              </div>

              {badge.earned ? (
                <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Earned
                </p>
              ) : (
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-orange-400" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">{badge.progressLabel}</p>
                </div>
              )}

              {isOpen && (
                <p className="mt-4 rounded-lg bg-orange-50 px-3 py-2.5 text-sm leading-relaxed text-orange-900" role="status">
                  <span className="font-semibold">How to earn it: </span>
                  {badge.howToEarn}
                </p>
              )}
              {!isOpen && <p className="mt-3 text-xs font-medium text-orange-600">Tap to see how to earn it</p>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
