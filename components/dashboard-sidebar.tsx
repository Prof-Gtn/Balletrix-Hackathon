import { Briefcase, FileCheck2, Sparkles } from "lucide-react";
import { Brand } from "@/components/brand";

// The dashboard's three wizard steps; the wizard switches step when the URL hash changes.
const NAV_ITEMS = [
  { href: "#step-1", label: "1. Your Business", icon: Sparkles },
  { href: "#step-2", label: "2. Fix & Prove", icon: FileCheck2 },
  { href: "#step-3", label: "3. Get Funded", icon: Briefcase },
];

export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "MS"
  );
}

export function DashboardSidebar({ name, email }: { name: string; email: string }) {
  return (
    <aside className="sticky top-0 flex h-screen flex-col bg-navy px-[9px] py-[18px] text-[#c3ccdb] md:px-[15px] md:py-6">
      <Brand hideNameOnMobile className="border-b border-white/[0.07] px-[7px] pb-[23px] text-[19px] text-white md:px-2.5 md:pb-[25px]" />

      <p className="hidden px-3 pt-[25px] pb-2.5 text-[10px] tracking-[1.4px] text-[#728199] uppercase md:block">Workspace</p>
      <nav aria-label="Main navigation" className="mt-4 grid gap-[5px] md:mt-0">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            title={label}
            className="flex min-h-[48px] items-center justify-center gap-3 rounded-[11px] px-[5px] py-[13px] text-sm font-semibold text-[#aab6c9] transition hover:bg-white/5 hover:text-white md:justify-start md:px-[13px] md:py-3"
          >
            <Icon className="h-[18px] w-[18px] shrink-0 md:h-4 md:w-4" />
            <span className="hidden md:inline">{label}</span>
          </a>
        ))}
      </nav>

      <div className="mt-auto flex items-center justify-center gap-2.5 border-t border-white/[0.07] pt-4 md:justify-start md:px-2 md:pt-[18px]">
        <div className="grid h-[37px] w-[37px] shrink-0 place-items-center rounded-full bg-[#dcd8ff] text-xs font-extrabold text-[#5146b8]">
          {initials(name)}
        </div>
        <div className="hidden min-w-0 md:block">
          <b className="block truncate text-xs text-white">{name}</b>
          <small className="mt-1 block truncate text-[10px] text-[#8190a7]">{email}</small>
        </div>
      </div>
    </aside>
  );
}
