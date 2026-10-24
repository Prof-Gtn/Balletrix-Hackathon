"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChatWidget } from "@/components/ChatWidget";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

// Pages that render without the sidebar and header: marketing, auth, onboarding, and the investor area
// (which has its own layout).
const BARE_PATHS = ["/", "/login", "/signup", "/onboarding"];
const BARE_PREFIXES = ["/investor", "/auth"];

export function isBarePath(pathname: string): boolean {
  return BARE_PATHS.includes(pathname) || BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function AppShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isBarePath(pathname)) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-w-0 flex-1">
        <Header name={name} onMenu={() => setMenuOpen(true)} />
        <main className="pb-24">{children}</main>
      </div>
      {/* /mentor is already the full chat, so the floating widget would duplicate it there. */}
      {pathname !== "/mentor" && <ChatWidget firstName={name.split(/\s+/)[0]} />}
    </div>
  );
}
