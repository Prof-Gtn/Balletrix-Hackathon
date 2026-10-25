"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Briefcase,
  ClipboardCheck,
  LayoutGrid,
  LifeBuoy,
  Rocket,
  Settings,
  ShieldCheck,
  TrendingUp,
  ShieldHalf,
  Trophy,
  X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { GLOSSARY, InfoTip, TRUST_PACK } from "@/components/info-tip";
import { SignOutButton } from "@/components/sign-out-button";
import type { Role } from "@/lib/roles";
import { cn } from "@/lib/utils";

// `tip` explains a term first-time founders may not know, shown with a "?" beside the link.
type NavItem = { href: string; label: string; icon: typeof LayoutGrid; tip?: { term: string; text: string } };

const SUPPORT: NavItem = { href: "/support", label: "Help & Support", icon: LifeBuoy };
const SETTINGS: NavItem = { href: "/settings", label: "Settings", icon: Settings };
const MENTOR: NavItem = { href: "/mentor", label: "AI Mentor", icon: Bot };

// Each role sees only its own pages. The pages also check the role, so hiding a link is never the only guard.
// Entrepreneurs' links follow their journey: set up, get assessed, prove it, progress, then get funded.
export const NAV_ITEMS: Record<Role, NavItem[]> = {
  entrepreneur: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/profile", label: "My Business Profile", icon: Briefcase },
    { href: "/assessment", label: "Assessment", icon: ClipboardCheck },
    { href: "/evidence", label: "Evidence Centre", icon: ShieldHalf, tip: { term: "Evidence Centre", text: GLOSSARY.evidence } },
    { href: "/incubation", label: "Incubation Programme", icon: Rocket },
    { href: "/reports", label: "Reports", icon: BarChart3, tip: { term: TRUST_PACK.name, text: GLOSSARY.trustPack } },
    { href: "/gamification", label: "Gamification", icon: Trophy },
    MENTOR,
    SUPPORT,
  ],
  investor: [{ href: "/investor/dashboard", label: "Investor Portal", icon: TrendingUp }, MENTOR, SUPPORT, SETTINGS],
  admin: [{ href: "/admin/dashboard", label: "Admin Dashboard", icon: ShieldCheck }, SUPPORT, SETTINGS],
};

// Dark navy sidebar from the template, with the orange-bordered active item. On small screens it is a
// slide-in drawer opened from the header's menu button.
export function Sidebar({ open, onClose, role }: { open: boolean; onClose: () => void; role: Role }) {
  const pathname = usePathname();
  // The investor portal's startup pages live under /investor/startups, so they keep "Investor Portal" active.
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) || (href === "/investor/dashboard" && pathname.startsWith("/investor/"));

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn("no-print fixed inset-0 z-30 bg-navy-2/60 transition-opacity md:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
      />
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col justify-between bg-navy text-white transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-6">
            <Brand className="text-lg" />
            <button type="button" onClick={onClose} aria-label="Close menu" className="text-slate-400 hover:text-white md:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav aria-label="Main navigation" className="mt-4 space-y-1 px-4">
            {NAV_ITEMS[role].map(({ href, label, icon: Icon, tip }) => {
              const active = isActive(href);
              return (
                // The "?" sits beside the link, not inside it: a button can't be nested in a link.
                <div key={href} className="relative">
                  <Link
                    href={href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
                      tip && "pr-10",
                      active
                        ? "border-l-4 border-brand bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-[18px] w-5 shrink-0" />
                    {label}
                  </Link>
                  {tip && (
                    <span className="absolute top-1/2 right-3 -translate-y-1/2">
                      <InfoTip text={tip.text} label={tip.term} tone="dark" align="end" />
                    </span>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
        <div className="border-t border-slate-800 p-4">
          <SignOutButton variant="sidebar" />
        </div>
      </aside>
    </>
  );
}
