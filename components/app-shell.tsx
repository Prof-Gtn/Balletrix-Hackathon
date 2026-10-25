"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChatWidget } from "@/components/ChatWidget";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import type { Language } from "@/lib/languages";
import type { Role } from "@/lib/roles";

// Pages that render without the sidebar and header: marketing, auth and onboarding.
const BARE_PATHS = ["/", "/login", "/signup", "/onboarding"];
const BARE_PREFIXES = ["/auth"];
// Public pages that still get the floating chat (the MulaStream assistant for visitors).
const PUBLIC_CHAT_PATHS = ["/", "/login", "/signup"];
// Pages that show the chat full-size, so they don't also get the floating widget.
const FULL_CHAT_PATHS = ["/mentor", "/support"];

export function isBarePath(pathname: string): boolean {
  return BARE_PATHS.includes(pathname) || BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function AppShell({
  name,
  email,
  isLoggedIn,
  role,
  language,
  children,
}: {
  name: string;
  email: string;
  isLoggedIn: boolean;
  role: Role;
  language: Language;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = name.split(/\s+/)[0];

  if (isBarePath(pathname)) {
    return (
      <>
        {children}
        {PUBLIC_CHAT_PATHS.includes(pathname) && (
          <ChatWidget mode={isLoggedIn ? "member" : "guest"} firstName={firstName} />
        )}
      </>
    );
  }

  return (
    <div className="print-main flex min-h-screen bg-gray-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} role={role} />
      <div className="print-main min-w-0 flex-1">
        <Header name={name} email={email} role={role} language={language} onMenu={() => setMenuOpen(true)} />
        <main className="print-main pb-24">{children}</main>
      </div>
      {/* /mentor and /support already have the full chat, so the floating widget would duplicate it. */}
      {!FULL_CHAT_PATHS.includes(pathname) && <ChatWidget mode="member" firstName={firstName} />}
    </div>
  );
}
