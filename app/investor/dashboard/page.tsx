import Link from "next/link";
import { ArrowRight, FileText, GraduationCap, Rocket } from "lucide-react";
import { InvestorHeader } from "@/components/investor-header";
import { InvestorPreferencesForm, type InvestorPreferences } from "@/components/investor-preferences-form";
import { loadReadyStartups, requireInvestor } from "@/lib/investor";
import { formatNad, INSTRUMENTS, isInstrument } from "@/lib/investors";
import { cn } from "@/lib/utils";

export default async function InvestorDashboardPage() {
  const { supabase, user } = await requireInvestor();

  const [{ data, error }, { startups, error: startupsError }] = await Promise.all([
    supabase
      .from("investor_preferences")
      .select("preferred_sector, max_investment_amount, preferred_instrument")
      .eq("user_id", user.id)
      .maybeSingle(),
    loadReadyStartups(supabase),
  ]);

  const preferences: InvestorPreferences | null =
    data && isInstrument(data.preferred_instrument)
      ? {
          preferred_sector: data.preferred_sector,
          max_investment_amount: Number(data.max_investment_amount),
          preferred_instrument: data.preferred_instrument,
        }
      : null;

  // Startups in the investor's preferred sector first, then by readiness score (the database's order).
  const feed = [...startups].sort(
    (a, b) => Number(b.sector === preferences?.preferred_sector) - Number(a.sector === preferences?.preferred_sector)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <InvestorHeader email={user.email ?? ""} />

      <main className="mx-auto grid max-w-6xl gap-6 p-4 md:p-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Investment-Ready Startups</h1>
            <p className="mt-1 text-sm text-gray-500">
              Namibian businesses that passed all MulaStream gates. Each has an AI-audited due diligence package.
            </p>
          </div>

          {startupsError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              We couldn&apos;t load startups: {startupsError}
            </p>
          ) : !feed.length ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
              <Rocket className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="font-medium text-slate-700">No investment-ready startups yet</p>
              <p className="mt-1 text-sm text-gray-500">Startups appear here once they reach Month 3 of the incubation programme.</p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {feed.map((startup) => {
                const score = Math.round(Number(startup.readiness_score ?? 0));
                const matches = Boolean(preferences && startup.sector === preferences.preferred_sector);
                return (
                  <li key={startup.id} className="flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-bold text-slate-800">{startup.business_name || "Unnamed business"}</h2>
                        <p className="mt-0.5 text-sm text-gray-500">{startup.sector || "Sector not set"}</p>
                      </div>
                      {matches && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          Your sector
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-gray-500">Readiness Score</span>
                        <span className="font-bold text-slate-800">{score}/100</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-gray-100">
                        <div
                          className={cn("h-1.5 rounded-full", score >= 80 ? "bg-emerald-500" : "bg-orange-500")}
                          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                        />
                      </div>
                    </div>
                    <Link
                      href={`/investor/startups/${startup.id}`}
                      className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      <FileText className="h-4 w-4" /> View Due Diligence Package <ArrowRight className="h-4 w-4" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-slate-800">Investor Preferences</h2>
            <p className="mb-5 text-sm text-gray-500">Tell us what you invest in. Startups in your sector are shown first.</p>
            {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-700">Could not load your preferences: {error.message}</p>}
            <InvestorPreferencesForm initial={preferences} />
            {preferences && (
              <dl className="mt-5 grid gap-2 border-t border-gray-100 pt-4 text-sm">
                <Row label="Sector" value={preferences.preferred_sector} />
                <Row label="Maximum" value={formatNad(preferences.max_investment_amount)} />
                <Row label="Instrument" value={INSTRUMENTS[preferences.preferred_instrument]} />
              </dl>
            )}
          </section>
          <section className="investment-bg rounded-xl p-6 text-white">
            <div className="relative z-10">
              <GraduationCap className="mb-3 h-6 w-6 text-orange-300" />
              <h2 className="mb-2 font-bold">How startups qualify</h2>
              <p className="text-sm leading-relaxed text-slate-300">
                Every business is scored by an AI auditor against 10 criteria, with verified documents kept separate from founder
                claims. Only businesses that pass all three monthly gates appear here.
              </p>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
