"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LifeBuoy, Loader2, LogOut, Menu, Settings } from "lucide-react";
import { Brand } from "@/components/brand";
import { LanguageSelector } from "@/components/LanguageSelector";
import type { Language } from "@/lib/languages";
import type { Role } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";

// Closes a popover when the user clicks outside it or presses Escape.
function useDismiss(ref: React.RefObject<HTMLElement | null>, isOpen: boolean, close: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) close();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, isOpen, close]);
}

const menuItemClass = "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50";

// White top header from the template: AI language, notification bell and the avatar menu (Settings, Support, Logout).
export function Header({
  name,
  email,
  role,
  language,
  onMenu,
}: {
  name: string;
  email: string;
  role: Role;
  language: Language;
  onMenu: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Entrepreneurs' settings are their business profile; investors and admins get the account page.
  const settingsHref = role === "entrepreneur" ? "/profile" : "/settings";
  const bellRef = useRef<HTMLDivElement>(null);

  useDismiss(menuRef, isOpen, () => setIsOpen(false));
  useDismiss(bellRef, showNotifications, () => setShowNotifications(false));

  // Close the menu after navigating to another page.
  useEffect(() => setIsOpen(false), [pathname]);

  async function handleLogout() {
    setSigningOut(true);
    await createClient().auth.signOut();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 md:px-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenu} aria-label="Open menu" className="text-slate-600 md:hidden">
          <Menu className="h-6 w-6" />
        </button>
        <Brand className="text-base text-slate-800 md:hidden" />
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <LanguageSelector initial={language} />
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
            <div className="absolute right-0 z-50 mt-3 w-64 rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-500 shadow-lg">
              You&apos;re all caught up. We&apos;ll let you know when your documents are checked.
            </div>
          )}
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            className="flex items-center gap-3 rounded-full py-1 pr-2 pl-1 transition hover:bg-slate-50"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-500 text-xs font-bold text-white">{initials(name)}</span>
            <span className="hidden text-sm font-medium text-slate-800 sm:inline">{name}</span>
            <ChevronDown className={cn("h-4 w-4 text-gray-500 transition", isOpen && "rotate-180")} />
          </button>

          {isOpen && (
            <div
              role="menu"
              aria-label="Account"
              className="absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black/5"
            >
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
                <p className="truncate text-xs text-gray-500">{email}</p>
              </div>
              <div className="py-1">
                <Link href={settingsHref} role="menuitem" onClick={() => setIsOpen(false)} className={cn(menuItemClass, "text-slate-700")}>
                  <Settings className="h-4 w-4 text-gray-400" /> Settings
                </Link>
                <Link href="/support" role="menuitem" onClick={() => setIsOpen(false)} className={cn(menuItemClass, "text-slate-700")}>
                  <LifeBuoy className="h-4 w-4 text-gray-400" /> Support
                </Link>
              </div>
              <div className="border-t border-gray-100 py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  disabled={signingOut}
                  className={cn(menuItemClass, "text-red-600 disabled:opacity-60")}
                >
                  {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
