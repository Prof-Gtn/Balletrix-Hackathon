import Link from "next/link";
import { CheckCircle2, Circle, Gauge, Layers, Sparkles } from "lucide-react";
import { BusinessProfileForm } from "@/components/business-profile-form";
import { Card, PageTitle } from "@/components/page-title";
import { loadEntrepreneur } from "@/lib/entrepreneur";
import { PHASES } from "@/lib/incubation";

export default async function BusinessProfilePage() {
  const { profile, readinessScore, currentMonth, error } = await loadEntrepreneur();

  // Profile completeness from what's actually filled in, so it moves as the founder adds details.
  const checklist = [
    { label: "Business name", done: Boolean(profile?.business_name) },
    { label: "Sector", done: Boolean(profile?.sector) },
    { label: "Target market", done: Boolean(profile?.target_market) },
    { label: "Business description", done: Boolean(profile?.business_description) },
    { label: "First AI assessment", done: readinessScore > 0 },
  ];
  const completeness = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageTitle title="Business Profile" subtitle="Keep your business details up to date. Your AI mentor and investor reports use them." />

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">We couldn&apos;t load your profile: {error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-1 text-lg font-bold text-slate-800">Business Details</h2>
          <p className="mb-6 text-sm text-gray-500">Changes are saved to your profile straight away.</p>
          <BusinessProfileForm
            initial={{
              business_name: profile?.business_name ?? "",
              sector: profile?.sector ?? "",
              target_market: profile?.target_market ?? "",
              business_description: profile?.business_description ?? "",
            }}
            showTargetMarket
            submitLabel="Save Changes"
          />
        </Card>

        <aside className="space-y-6">
          <Card>
            <h2 className="mb-5 text-lg font-bold text-slate-800">Your Stats</h2>
            <dl className="space-y-5">
              <Stat icon={Gauge} label="Readiness Score" value={`${readinessScore}/100`} progress={readinessScore} />
              <Stat icon={Layers} label="Current Month" value={`Month ${currentMonth} of 3`} hint={PHASES[currentMonth].name} progress={(currentMonth / 3) * 100} />
              <Stat icon={CheckCircle2} label="Profile Completeness" value={`${completeness}% complete`} progress={completeness} />
            </dl>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-bold text-slate-800">Complete your profile</h2>
            <ul className="space-y-2.5">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-sm">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-gray-300" />
                  )}
                  <span className={item.done ? "text-slate-700" : "text-gray-500"}>{item.label}</span>
                </li>
              ))}
            </ul>
            {readinessScore === 0 && (
              <Link href="/assessment" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:underline">
                <Sparkles className="h-4 w-4" /> Run your first assessment
              </Link>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  progress,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  progress: number;
}) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Icon className="h-4 w-4 text-orange-500" /> {label}
      </dt>
      <dd className="mt-1 text-xl font-bold text-slate-800">{value}</dd>
      {hint && <dd className="text-xs text-gray-500">{hint}</dd>}
      <div className="mt-2 h-1.5 rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-orange-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
      </div>
    </div>
  );
}
