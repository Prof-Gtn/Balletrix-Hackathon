import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Brand } from "@/components/brand";
import { InvestorPreferencesForm, type InvestorPreferences } from "@/components/investor-preferences-form";
import { SignOutButton } from "@/components/sign-out-button";
import { formatNad, INSTRUMENTS, isInstrument } from "@/lib/investors";
import { createClient } from "@/lib/supabase/server";

export default async function InvestorDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("investor_preferences")
    .select("preferred_sector, max_investment_amount, preferred_instrument")
    .eq("user_id", user.id)
    .maybeSingle();

  const preferences: InvestorPreferences | null =
    data && isInstrument(data.preferred_instrument)
      ? {
          preferred_sector: data.preferred_sector,
          max_investment_amount: Number(data.max_investment_amount),
          preferred_instrument: data.preferred_instrument,
        }
      : null;

  return (
    <div className="min-h-screen">
      <header className="flex h-[66px] items-center justify-between gap-4 border-b border-line bg-white px-4 md:h-[76px] md:px-8">
        <Brand className="text-lg" />
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted sm:inline">{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto grid max-w-[980px] gap-6 px-4 py-8 md:grid-cols-[minmax(0,1fr)_320px] md:px-8 md:py-10">
        <section className="rounded-[22px] border border-[#e9edf5] bg-white p-[clamp(22px,4vw,34px)] shadow-soft">
          <h1 className="mb-2 text-[clamp(23px,3vw,28px)] font-bold tracking-[-1px]">Investor preferences</h1>
          <p className="mb-[26px] text-[13px] leading-normal text-muted">
            Tell us what you invest in. Entrepreneurs who pass all three MulaStream gates in your sector will see you as a
            matched investor.
          </p>
          {error && (
            <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-xs text-danger">
              Could not load your preferences: {error.message}
            </p>
          )}
          <InvestorPreferencesForm initial={preferences} />
        </section>

        <aside className="flex flex-col gap-4">
          {preferences && (
            <div className="rounded-2xl border border-[#edf0f6] bg-white p-5 shadow-card">
              <h2 className="mb-3 text-sm font-bold">Your current preferences</h2>
              <dl className="grid gap-2.5 text-xs">
                <Row label="Sector" value={preferences.preferred_sector} />
                <Row label="Maximum" value={formatNad(preferences.max_investment_amount)} />
                <Row label="Instrument" value={INSTRUMENTS[preferences.preferred_instrument]} />
              </dl>
            </div>
          )}
          <div className="relative overflow-hidden rounded-2xl bg-[#1a202c] p-[22px] text-white">
            <GraduationCap className="mb-3 h-6 w-6 text-brand-light" />
            <h2 className="mb-2 text-base font-bold">How matching works</h2>
            <p className="text-[11px] leading-[1.6] text-[#c3c8dd]">
              Every business on MulaStream is scored by a strict AI auditor against 10 criteria, with verified evidence kept
              separate from founder claims. Only businesses that unlock all three monthly gates are shown to investors.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
