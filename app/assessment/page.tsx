import { redirect } from "next/navigation";
import { Briefcase, Calculator, Handshake, ShieldAlert, ShieldCheck } from "lucide-react";
import { ActionPlan } from "@/components/action-plan";
import { AssessmentProvider } from "@/components/assessment-context";
import { AssessmentForm } from "@/components/assessment-form";
import { DashboardWizard } from "@/components/dashboard-wizard";
import { DCFCalculator } from "@/components/dcf-calculator";
import { DueDiligencePackage } from "@/components/due-diligence-package";
import { CountChip, countEvidence, EvidenceList } from "@/components/evidence-list";
import { EvidenceUploadForm } from "@/components/evidence-upload-form";
import { PageTitle } from "@/components/page-title";
import { RedTeamCard } from "@/components/red-team-card";
import { RerunAssessment } from "@/components/rerun-assessment";
import { ASSESSMENT_EVIDENCE_TYPE } from "@/lib/evidence";
import { GATE_REQUIREMENTS, toIncubationMonth } from "@/lib/gates";
import { formatNad, INSTRUMENTS, isInstrument, MOCK_ENTREPRENEUR_SECTOR } from "@/lib/investors";
import { HOME, toRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/utils";

// Row shape returned by the match_investors database function.
type MatchedInvestor = {
  investor_id: string;
  email: string | null;
  preferred_sector: string;
  max_investment_amount: number;
  preferred_instrument: string;
};

export default async function AssessmentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile, error }, { data: evidence, error: evidenceError }] = await Promise.all([
    // "*" rather than a column list: red_team_flaws, roadmap and reconciliation_status only exist once
    // their migrations have run, and naming them before that would fail the whole query.
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("evidence_submissions")
      .select("*")
      .eq("user_id", user.id)
      .neq("evidence_type", ASSESSMENT_EVIDENCE_TYPE)
      .not("file_url", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const role = toRole(profile?.role);
  if (role !== "entrepreneur") redirect(HOME[role]);

  const currentMonth = toIncubationMonth(profile?.current_month ?? 1);
  const readinessScore: number = profile?.readiness_score ?? 0;
  const businessName: string | null = profile?.business_name || null;
  const hasAssessment = readinessScore > 0 || Boolean(profile?.roadmap) || Boolean(profile?.red_team_flaws);

  // Step 3 (and the investors in it) unlocks once the entrepreneur reaches the final incubation month.
  const fundingUnlocked = (profile?.current_month ?? 1) >= 3;
  const { data: matches, error: matchError } = fundingUnlocked
    ? await supabase.rpc("match_investors", { p_sector: MOCK_ENTREPRENEUR_SECTOR })
    : { data: null, error: null };
  const matchedInvestors = (matches ?? []) as MatchedInvestor[];

  const { checkedCount, needsAttentionCount } = countEvidence(evidence ?? [], currentMonth);

  const steps = [
    {
      title: "Your Business",
      subtitle: "Type a short description or upload your business plan. We'll check it and give you a score.",
      done: hasAssessment,
      content: <AssessmentForm />,
    },
    {
      title: "Fix & Prove",
      subtitle: `Follow your action plan, then upload proof. To unlock Month ${currentMonth < 3 ? currentMonth + 1 : 3}, you need ${GATE_REQUIREMENTS[currentMonth].sentence}.`,
      content: (
        <div className="flex flex-col gap-8">
          <ActionPlan saved={profile?.roadmap ?? null} />
          <RedTeamCard data={profile?.red_team_flaws ?? null} />

          <div className="flex flex-col gap-6 rounded-3xl border border-line p-5 sm:p-7">
            <div className="grid grid-cols-2 gap-3">
              <CountChip label="Checked Documents" count={checkedCount} icon={ShieldCheck} tone="good" />
              <CountChip label="Needs Attention" count={needsAttentionCount} icon={ShieldAlert} tone="bad" />
            </div>
            <EvidenceUploadForm />
            <EvidenceList evidence={evidence ?? []} />
          </div>

          <RerunAssessment />
        </div>
      ),
    },
    {
      title: "Get Funded",
      subtitle: "Prepare a professional package for investors and see who is interested in your sector.",
      lockedMessage: fundingUnlocked
        ? undefined
        : `Step 3 unlocks when you reach Month 3. You're in Month ${currentMonth} now: complete your action plan and pass the gate in Step 2 to move forward.`,
      content: (
        <div className="flex flex-col gap-8">
          <FundingBlock icon={Briefcase} title="Due Diligence Package">
            <DueDiligencePackage />
          </FundingBlock>
          <FundingBlock icon={Handshake} title="Matched Investors" aside={`Sector: ${MOCK_ENTREPRENEUR_SECTOR}`}>
            <MatchedInvestors investors={matchedInvestors} error={matchError?.message ?? null} />
          </FundingBlock>
          <FundingBlock icon={Calculator} title="What is my business worth?">
            <DCFCalculator />
          </FundingBlock>
        </div>
      ),
    },
  ];

  return (
    <AssessmentProvider currentMonth={currentMonth}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
        <PageTitle
          title="Assessment"
          subtitle={
            businessName
              ? `Get an honest score for ${businessName}, fix what's holding it back, and prove it with documents.`
              : "Get an honest score for your business, fix what's holding it back, and prove it with documents."
          }
        />

        {(error || evidenceError) && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            We couldn&apos;t load all your information: {(error ?? evidenceError)?.message}
          </p>
        )}

        <ScoreBanner score={readinessScore} month={currentMonth} />

        <DashboardWizard steps={steps} initialStep={hasAssessment ? 2 : 1} />
      </div>
    </AssessmentProvider>
  );
}

function ScoreBanner({ score, month }: { score: number; month: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  return (
    <section className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white sm:p-8" aria-label="Your progress">
      <div aria-hidden className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full border border-white/[0.07] shadow-[0_0_0_30px_#ffffff05]" />
      <div className="relative flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <p className="text-sm font-bold text-[#c3ccdc]">Your Investment Readiness Score</p>
          <p className="mt-1 text-[52px] leading-none font-extrabold tracking-[-2px] sm:text-[64px]">
            {score}
            <span className="text-2xl font-bold tracking-normal text-[#8b98aa]">/100</span>
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm font-bold text-[#c3ccdc]">Current Stage</p>
          <p className="mt-1 text-2xl font-extrabold">Month {month} of 3</p>
        </div>
      </div>
      <div
        className="relative mt-6 h-3 rounded-full bg-white/10"
        role="progressbar"
        aria-label="Investment Readiness Score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
      >
        <div className="h-3 rounded-full bg-brand-light transition-[width]" style={{ width: `${clamped}%` }} />
      </div>
      <p className="relative mt-3 text-sm text-[#c3ccdc]">
        To unlock the next month you need: <b className="text-white">{GATE_REQUIREMENTS[toIncubationMonth(month)].summary}</b>
      </p>
    </section>
  );
}

function FundingBlock({
  icon: Icon,
  title,
  aside,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-line p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-extrabold">
          <Icon className="h-5 w-5 text-brand" /> {title}
        </h3>
        {aside && <span className="rounded-lg border border-line px-2.5 py-1 text-xs text-[#68768c]">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function MatchedInvestors({ investors, error }: { investors: MatchedInvestor[]; error: string | null }) {
  if (error) return <p className="text-sm text-danger">We couldn&apos;t load matched investors: {error}</p>;
  if (!investors.length) {
    return <p className="text-sm text-muted">No investors are looking for {MOCK_ENTREPRENEUR_SECTOR} businesses yet.</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {investors.map((investor) => (
        <li key={investor.investor_id} className="flex items-center gap-3 rounded-2xl border border-[#f0f2f7] p-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-xs font-extrabold text-brand">
            {initials(investor.email?.split("@")[0] ?? "Investor")}
          </div>
          <div className="min-w-0 flex-1">
            <b className="mb-1 block truncate text-sm">{investor.email ?? "MulaStream investor"}</b>
            <small className="text-xs text-[#8b98aa]">
              {isInstrument(investor.preferred_instrument) ? INSTRUMENTS[investor.preferred_instrument] : investor.preferred_instrument} ·{" "}
              {investor.preferred_sector}
            </small>
          </div>
          <div className="text-right whitespace-nowrap">
            <b className="mb-1 block text-sm text-success">{formatNad(Number(investor.max_investment_amount))}</b>
            <small className="text-[10px] text-[#96a2b3]">max amount</small>
          </div>
        </li>
      ))}
    </ul>
  );
}
