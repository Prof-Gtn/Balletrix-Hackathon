import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, FileLock2, Info, MapPin, Target, TrendingUp, Users } from "lucide-react";
import { DueDiligencePackage } from "@/components/due-diligence-package";
import { TRUST_PACK } from "@/components/info-tip";
import { loadReadyStartups, requireInvestor } from "@/lib/investor";
import { findShowcaseStartup, sectorOutlook } from "@/lib/showcase";

export default async function StartupProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireInvestor();

  const sample = findShowcaseStartup(id);
  if (sample) {
    return (
      <Layout>
        <ProfileHeader
          name={sample.businessName}
          subtitle={`${sample.sector} · ${sample.speciality}`}
          badge={<span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">Sample profile</span>}
          score={sample.readinessScore ?? null}
        />
        <p className="flex items-start gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm leading-relaxed text-gray-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          This is a sample profile for the demo. The business is not a MulaStream user and has not been assessed or verified by
          MulaStream; highlights are as publicly reported.
        </p>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
          <Panel title="About the business">
            <p className="text-sm leading-relaxed text-slate-700">{sample.about}</p>
            <h3 className="mt-5 mb-2 text-sm font-bold text-slate-800">Reported highlights</h3>
            <ul className="flex flex-wrap gap-2">
              {sample.highlights.map((h) => (
                <li key={h} className="rounded-md bg-orange-50 px-2.5 py-1 text-sm font-medium text-orange-800">
                  {h}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Key facts">
            <Facts
              items={[
                { icon: MapPin, label: "Location", value: sample.location },
                { icon: Users, label: sample.founders.includes("&") ? "Founders" : "Founder", value: sample.founders },
                { icon: TrendingUp, label: "Market projection", value: sectorOutlook(sample.sector) },
              ]}
            />
          </Panel>
        </div>
        <Panel title={TRUST_PACK.name} subtitle={TRUST_PACK.subtitle}>
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <FileLock2 className="h-5 w-5 shrink-0 text-gray-400" />
            No Investor Trust Pack is available for sample profiles. A verified pack is created once a business completes
            MulaStream&apos;s three-month programme.
          </div>
        </Panel>
      </Layout>
    );
  }

  const { startups } = await loadReadyStartups(supabase);
  const startup = startups.find((s) => s.id === id);
  if (!startup) notFound();

  return (
    <Layout>
      <ProfileHeader
        name={startup.business_name || "Unnamed business"}
        subtitle={`${startup.sector || "Sector not set"} · Month ${startup.current_month ?? 3} of 3`}
        badge={
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified Trust Pack
          </span>
        }
        score={Math.round(Number(startup.readiness_score ?? 0))}
      />
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
        <Panel title="About the business">
          <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700">
            {startup.business_description || "The founder hasn't added a description yet."}
          </p>
        </Panel>
        <Panel title="Key facts">
          <Facts
            items={[
              { icon: Target, label: "Target market", value: startup.target_market || "Not provided" },
              { icon: TrendingUp, label: "Market projection", value: sectorOutlook(startup.sector) },
            ]}
          />
        </Panel>
      </div>
      <Panel title={TRUST_PACK.name} subtitle={TRUST_PACK.subtitle}>
        <DueDiligencePackage startupId={startup.id} />
      </Panel>
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        <Link href="/investor/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back to startups
        </Link>
        {children}
      </div>
    </div>
  );
}

function ProfileHeader({ name, subtitle, badge, score }: { name: string; subtitle: string; badge: React.ReactNode; score: number | null }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-2">{badge}</div>
        <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">{name}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white px-5 py-3 text-right shadow-sm">
        <p className="text-xs font-medium text-gray-500">Readiness Score</p>
        <p className="text-2xl font-bold text-slate-800">{score === null ? "Not assessed" : `${score}/100`}</p>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Facts({ items }: { items: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[] }) {
  return (
    <dl className="space-y-4">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-start gap-3">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
          <div>
            <dt className="text-xs font-medium text-gray-500">{label}</dt>
            <dd className="text-sm font-semibold text-slate-800">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
