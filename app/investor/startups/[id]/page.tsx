import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DueDiligencePackage } from "@/components/due-diligence-package";
import { InvestorHeader } from "@/components/investor-header";
import { loadReadyStartups, requireInvestor } from "@/lib/investor";

export default async function StartupDueDiligencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireInvestor();

  const { startups } = await loadReadyStartups(supabase);
  const startup = startups.find((s) => s.id === id);
  if (!startup) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <InvestorHeader email={user.email ?? ""} />

      <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        <Link href="/investor/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back to startups
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{startup.business_name || "Unnamed business"}</h1>
            <p className="mt-1 text-sm text-gray-500">{startup.sector || "Sector not set"} · Month {startup.current_month ?? 3} of 3</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-5 py-3 text-right shadow-sm">
            <p className="text-xs font-medium text-gray-500">Readiness Score</p>
            <p className="text-2xl font-bold text-slate-800">{Math.round(Number(startup.readiness_score ?? 0))}/100</p>
          </div>
        </div>

        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-800">Due Diligence Package</h2>
          <DueDiligencePackage startupId={startup.id} />
        </section>
      </main>
    </div>
  );
}
