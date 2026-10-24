"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { MentorChat, type ChatMode } from "@/components/mentor-chat";
import { cn } from "@/lib/utils";

// Floating chat bubble. Logged-in users get the AI Mentor, personalised on the server with their
// business name, sector and readiness score (app/actions/mentor.ts); visitors get the public
// MulaStream assistant. It lives in the app shell, so the conversation stays open across page changes.
export function ChatWidget({ mode, firstName = "" }: { mode: ChatMode; firstName?: string }) {
  const [open, setOpen] = useState(false);
  // Keep the chat mounted after the first open so closing the panel doesn't lose the conversation.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggle() {
    setMounted(true);
    setOpen((v) => !v);
  }

  const label = mode === "member" ? "AI Mentor" : "MulaStream assistant";

  return (
    <>
      <div
        role="dialog"
        aria-label={`${label} chat`}
        aria-hidden={!open}
        className={cn(
          "fixed z-50 overflow-hidden bg-white shadow-2xl transition duration-200",
          // Full screen on phones, a pop-up window above the bubble on larger screens.
          "inset-0 sm:inset-auto sm:right-6 sm:bottom-24 sm:h-[min(620px,calc(100vh-8rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-gray-200",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        {/* Keyed by mode so logging in or out starts a fresh conversation with the right assistant. */}
        {mounted && <MentorChat key={mode} mode={mode} firstName={firstName} variant="widget" onClose={() => setOpen(false)} />}
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={open ? `Close ${label} chat` : `Chat with the ${label}`}
        aria-expanded={open}
        className={cn(
          "fixed right-4 bottom-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-600 sm:right-6 sm:bottom-6",
          open && "max-sm:hidden"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
