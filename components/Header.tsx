"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";
import { initials } from "@/lib/utils";

// White top header from the template: notification bell, avatar and name, and log out.
export function Header({ name, onMenu }: { name: string; onMenu: () => void }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showNotifications) return;
    function close(e: MouseEvent) {
      if (!bellRef.current?.contains(e.target as Node)) setShowNotifications(false);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showNotifications]);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 md:px-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenu} aria-label="Open menu" className="text-slate-600 md:hidden">
          <Menu className="h-6 w-6" />
        </button>
        <Brand className="text-base text-slate-800 md:hidden" />
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div ref={bellRef} className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((v) => !v)}
            aria-label="Notifications"
            aria-expanded={showNotifications}
            className="text-gray-400 transition hover:text-gray-600"
          >
            <Bell className="h-5 w-5" />
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-64 rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-500 shadow-soft">
              You&apos;re all caught up. We&apos;ll let you know when your documents are checked.
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-bold text-white">{initials(name)}</span>
          <span className="hidden text-sm font-medium text-slate-800 sm:inline">{name}</span>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
