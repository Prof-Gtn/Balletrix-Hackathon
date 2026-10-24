"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { MentorChat } from "@/components/mentor-chat";
import { cn } from "@/lib/utils";

// Floating AI Mentor chat for every protected page. It lives in the app shell, so the conversation
// stays open across page changes. The mentor's replies are personalised on the server with the user's
// business name, sector and readiness score (see app/actions/mentor.ts).
export function ChatWidget({ firstName }: { firstName: string }) {
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

  return (
    <>
      <div
        role="dialog"
        aria-label="AI Mentor chat"
        aria-hidden={!open}
        className={cn(
          "fixed z-50 overflow-hidden bg-white shadow-2xl transition duration-200",
          // Full screen on phones, a pop-up window above the bubble on larger screens.
          "inset-0 sm:inset-auto sm:right-6 sm:bottom-24 sm:h-[min(620px,calc(100vh-8rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-gray-200",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        {mounted && <MentorChat firstName={firstName} variant="widget" onClose={() => setOpen(false)} />}
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "Close AI Mentor chat" : "Chat with your AI Mentor"}
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
