import Link from "next/link";
import { Filter, Info, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { InvestorHeader } from "@/components/investor-header";
import { InvestorPreferencesForm, type InvestorPreferences } from "@/components/investor-preferences-form";
import { StartupCard, type StartupCardData } from "@/components/startup-card";
import { loadReadyStartups, requireInvestor } from "@/lib/investor";
import { formatNad, INSTRUMENTS, isInstrument } from "@/lib/investors";
import { SHOWCASE_ID_PREFIX, SHOWCASE_STARTUPS } from "@/lib/showcase";

export default async function InvestorDashboardPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams;
  const { supabase, user } = await requireInvestor();

  const [{ data, error }, { startups, error: startupsError }, { data: interests }] = await Promise.all([
    supabase
      .from("investor_preferences")
      .select("preferred_sector, max_investment_amount, preferred_instrument")
      .eq("user_id", user.id)
      .maybeSingle(),
    loadReadyStartups(supabase),
    supabase.from("investor_interests").select("entrepreneur_id").eq("investor_id", user.id),
  ]);
  // Startups this investor already expressed interest in (empty until the matchmaking migration runs).
  const interestedIn = new Set((interests ?? []).map((row) => row.entrepreneur_id as string));

  const preferences: InvestorPreferences | null =
    data && isInstrument(data.preferred_instrument)
      ? {
          preferred_sector: data.preferred_sector,
          max_investment_amount: Number(data.max_investment_amount),
          preferred_instrument: data.preferred_instrument,
        }
      : null;

  const platformCards: StartupCardData[] = startups.map((s) => ({
    href: `/investor/startups/${s.id}`,
    businessName: s.business_name || "Unnamed business",
    sector: s.sector,
    speciality: s.target_market ? `Serves ${s.target_market}` : undefined,
    readinessScore: Number(s.readiness_score ?? 0),
    kind: "platform",
    entrepreneurId: s.id,
    interested: interestedIn.has(s.id),
  }));
  const sampleCards: StartupCardData[] = SHOWCASE_STARTUPS.map((s) => ({
    href: `/investor/startups/${SHOWCASE_ID_PREFIX}${s.slug}`,
    businessName: s.businessName,
    sector: s.sector,
    speciality: s.speciality,
    location: s.location,
    founders: s.founders,
    highlights: s.highlights,
    readinessScore: s.readinessScore ?? null,
    imageUrl: s.imageUrl,
    kind: "sample",
  }));

  // Filter by the investor's preferred sector, unless they chose to see everything.
  const filterSector = preferences && all !== "1" ? preferences.preferred_sector : null;
  const bySector = (card: StartupCardData) => !filterSector || card.sector === filterSector;
  const platform = platformCards.filter(bySector);
  const samples = sampleCards.filter(bySector);

  const scored = platformCards.filter((c) => c.readinessScore !== null);
  const averageScore = scored.length
    ? Math.round(scored.reduce((sum, c) => sum + (c.readinessScore ?? 0), 0) / scored.length)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <InvestorHeader email={user.email ?? ""} />

      {/* Hero */}
      <section className="investment-bg px-4 py-10 text-white md:px-8 md:py-14">
        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-300">
            <Sparkles className="h-3.5 w-3.5" /> Investor Marketplace
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">Investment-Ready Namibian Startups</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Every MulaStream startup is scored by an AI auditor against 10 criteria, with verified documents kept separate from
            founder claims, and passes three monthly gates before it appears here.
          </p>
          <dl className="mt-8 grid max-w-2xl grid-cols-3 gap-4">
            <Stat label="Verified startups" value={String(platformCards.length)} />
            <Stat label="Average readiness" value={averageScore === null ? "—" : `${averageScore}/100`} />
            <Stat label="Sectors" value={String(new Set([...platformCards, ...sampleCards].map((c) => c.sector)).size)} />
          </dl>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-8 p-4 md:p-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-10">
          {filterSector && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm">
              <p className="flex items-center gap-2 text-orange-900">
                <Filter className="h-4 w-4" /> Showing <b>{filterSector}</b> startups, from your preferences.
              </p>
              <Link href="/investor/dashboard?all=1" className="font-semibold text-orange-700 hover:underline">
                Show all sectors
              </Link>
            </div>
          )}
          {!filterSector && preferences && (
            <p className="text-sm text-gray-500">
              Showing all sectors.{" "}
              <Link href="/investor/dashboard" className="font-semibold text-orange-600 hover:underline">
                Only show {preferences.preferred_sector}
              </Link>
            </p>
          )}

          <section>
            <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-slate-800">
              <ShieldCheck className="h-5 w-5 text-emerald-500" /> Verified on MulaStream
            </h2>
            <p className="mb-5 text-sm text-gray-500">Startups that passed all three gates, each with an AI-audited due diligence pack.</p>
            {startupsError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                We couldn&apos;t load startups: {startupsError}. If you&apos;re the administrator, run the investor marketplace
                migration in Supabase.
              </p>
            ) : platform.length ? (
              <div className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-3">
                {platform.map((card) => (
                  <StartupCard key={card.href} startup={card} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
                <Rocket className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                <p className="font-medium text-slate-700">
                  {filterSector ? `No verified ${filterSector} startups yet` : "No verified startups yet"}
                </p>
                <p className="mt-1 text-sm text-gray-500">Startups appear here once they reach Month 3 of the incubation programme.</p>
              </div>
            )}
          </section>

          {samples.length > 0 && (
            <section>
              <h2 className="mb-1 text-xl font-bold text-slate-800">Featured Namibian businesses</h2>
              <p className="mb-3 text-sm text-gray-500">Sample profiles for this demo, showing the kinds of businesses MulaStream supports.</p>
              <p className="mb-5 flex items-start gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs leading-relaxed text-gray-600">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                These businesses are not MulaStream users. They have not been assessed or verified by MulaStream, highlights are as
                publicly reported, and no due diligence pack exists for them.
              </p>
              <div className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-3">
                {samples.map((card) => (
                  <StartupCard key={card.href} startup={card} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-slate-800">Investor Preferences</h2>
            <p className="mb-5 text-sm text-gray-500">Set your sector to filter the startups you see.</p>
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
        </aside>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-1 text-2xl font-bold">{value}</dd>
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
