"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, ListChecks, ShieldHalf, Sparkles } from "lucide-react";

const STEPS = [
  { icon: ClipboardCheck, text: "Go to Assessment.", href: "/assessment" },
  { icon: ListChecks, text: "Check your Action Plan.", href: "/assessment" },
  { icon: ShieldHalf, text: "Upload proof in Evidence Centre.", href: "/evidence" },
];

// First-visit welcome for new founders (Month 1, no score yet). Closing it is remembered in this browser
// per user, so it doesn't come back on every visit; if storage is blocked it simply shows again.
export function WelcomeTour({ firstName, userId }: { firstName: string; userId: string }) {
  const storageKey = `mulastream-welcome-seen:${userId}`;
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Opened after mount so the server render and the first client render match.
  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(storageKey) === "1";
    } catch {}
    if (!seen) setOpen(true);
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;
    buttonRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {}
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/60 p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-orange-100 text-orange-600">
          <Sparkles className="h-6 w-6" />
        </span>
        <h2 id="welcome-title" className="mt-5 text-2xl font-bold text-slate-800">
          Welcome to MulaStream, {firstName}!
        </h2>
        <p className="mt-2 leading-relaxed text-gray-600">
          Your goal is to pass 3 gates to become investment-ready. Here is how to start:
        </p>
        <ol className="mt-6 space-y-3">
          {STEPS.map(({ icon: Icon, text, href }, i) => (
            <li key={text}>
              <Link
                href={href}
                onClick={close}
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:bg-slate-50"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-500 text-sm font-bold text-white">{i + 1}</span>
                <span className="flex-1 font-medium text-slate-800">{text}</span>
                <Icon className="h-5 w-5 text-gray-400" />
              </Link>
            </li>
          ))}
        </ol>
        <button
          ref={buttonRef}
          type="button"
          onClick={close}
          className="mt-8 w-full rounded-xl bg-orange-500 py-3.5 font-semibold text-white transition hover:bg-orange-600"
        >
          Got it, let&apos;s start!
        </button>
      </div>
    </div>
  );
}
