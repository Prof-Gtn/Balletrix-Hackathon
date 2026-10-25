import { redirect } from "next/navigation";
import { Briefcase, Calculator, Handshake } from "lucide-react";
import { AssessmentProvider } from "@/components/assessment-context";
import { AssessmentWorkspace, type LastGate } from "@/components/assessment-workspace";
import { DCFCalculator } from "@/components/dcf-calculator";
import { DueDiligencePackage } from "@/components/due-diligence-package";
import { EvidenceList } from "@/components/evidence-list";
import { EvidenceUploadForm } from "@/components/evidence-upload-form";
import { GLOSSARY, InfoTip, TRUST_PACK } from "@/components/info-tip";
import { PageTitle } from "@/components/page-title";
import { RedTeamCard } from "@/components/red-team-card";
import { ASSESSMENT_EVIDENCE_TYPE } from "@/lib/evidence";
import { toIncubationMonth } from "@/lib/gates";
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

  const [{ data: profile, error }, { data: evidence, error: evidenceError }, { data: lastAssessment }] = await Promise.all([
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
    // The latest assessment's gate result, for the score card.
    supabase
      .from("evidence_submissions")
      .select("month, ai_verification_status, ai_feedback")
      .eq("user_id", user.id)
      .eq("evidence_type", ASSESSMENT_EVIDENCE_TYPE)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const role = toRole(profile?.role);
  if (role !== "entrepreneur") redirect(HOME[role]);

  const currentMonth = toIncubationMonth(profile?.current_month ?? 1);
  const readinessScore: number = profile?.readiness_score ?? 0;
  const businessName: string | null = profile?.business_name || null;
  const hasAssessment =
    Boolean(lastAssessment) || readinessScore > 0 || Boolean(profile?.roadmap) || Boolean(profile?.red_team_flaws);

  // Funding tools (and the investors in them) unlock once the entrepreneur reaches the final incubation month.
  const fundingUnlocked = currentMonth >= 3;
  const { data: matches, error: matchError } = fundingUnlocked
    ? await supabase.rpc("match_investors", { p_sector: MOCK_ENTREPRENEUR_SECTOR })
    : { data: null, error: null };
  const matchedInvestors = (matches ?? []) as MatchedInvestor[];

  return (
    <AssessmentProvider currentMonth={currentMonth}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 p-4 md:p-8">
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

        <AssessmentWorkspace
          hasAssessment={hasAssessment}
          score={readinessScore}
          month={currentMonth}
          lastGate={lastAssessment ? toLastGate(lastAssessment) : null}
          savedRoadmap={profile?.roadmap ?? null}
          toughLove={<RedTeamCard data={profile?.red_team_flaws ?? null} />}
          evidence={
            <section className="flex flex-col gap-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <div>
                <h2 className="flex items-center gap-1.5 text-lg font-bold text-slate-800">
                  Upload Evidence <InfoTip text={GLOSSARY.evidence} label="Evidence" />
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Prove what you told us. Checked documents raise your score when you run the assessment again.
                </p>
              </div>
              <EvidenceUploadForm />
              <EvidenceList evidence={evidence ?? []} />
            </section>
          }
          funding={
            fundingUnlocked ? (
              <section className="flex flex-col gap-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Get Funded</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    You reached Month 3. Prepare your investor package and see who invests in your sector.
                  </p>
                </div>
                <FundingBlock icon={Briefcase} title={TRUST_PACK.name} subtitle={TRUST_PACK.subtitle} tip={GLOSSARY.trustPack}>
                  <DueDiligencePackage />
                </FundingBlock>
                <FundingBlock icon={Handshake} title="Matched Investors" aside={`Sector: ${MOCK_ENTREPRENEUR_SECTOR}`}>
                  <MatchedInvestors investors={matchedInvestors} error={matchError?.message ?? null} />
                </FundingBlock>
                <FundingBlock icon={Calculator} title="What is my business worth?">
                  <DCFCalculator />
                </FundingBlock>
              </section>
            ) : undefined
          }
        />
      </div>
    </AssessmentProvider>
  );
}

// The saved assessment row: "verified" means the gate passed; disqualifications are saved with a prefix.
function toLastGate(row: { month: number; ai_verification_status: string; ai_feedback: string | null }): LastGate {
  const feedback = row.ai_feedback ?? null;
  if (row.ai_verification_status === "verified") return { status: "PASSED", month: row.month, feedback };
  if (feedback?.startsWith("DISQUALIFIED:")) {
    return { status: "DISQUALIFIED", month: row.month, feedback: feedback.slice("DISQUALIFIED:".length).trim() };
  }
  return { status: "FAILED", month: row.month, feedback };
}

function FundingBlock({
  icon: Icon,
  title,
  aside,
  subtitle,
  tip,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  aside?: string;
  subtitle?: string;
  tip?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-gray-100 pt-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Icon className="h-5 w-5 text-brand" /> {title}
            {tip && <InfoTip text={tip} label={title} />}
          </h3>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
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
