import Link from "next/link";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";
import { initials } from "@/lib/utils";

// Top bar for the investor portal, in the template's navy.
export function InvestorHeader({ email }: { email: string }) {
  return (
    <header className="flex items-center justify-between gap-4 bg-navy px-4 py-4 text-white md:px-8">
      <Link href="/investor/dashboard" className="flex items-center gap-3">
        <Brand className="text-lg" />
        <span className="hidden rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-semibold text-orange-300 sm:inline">Investor Portal</span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-500 text-xs font-bold">{initials(email.split("@")[0])}</span>
        <span className="hidden text-sm text-slate-300 sm:inline">{email}</span>
        <div className="[&_button]:text-slate-300 [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
