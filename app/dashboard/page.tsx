import { redirect } from "next/navigation";
import { Briefcase, Calculator, FileText, Handshake, ShieldAlert, ShieldCheck, Siren } from "lucide-react";
import { ActionPlan } from "@/components/action-plan";
import { AssessmentProvider } from "@/components/assessment-context";
import { AssessmentForm } from "@/components/assessment-form";
import { DCFCalculator } from "@/components/dcf-calculator";
import { DashboardSidebar, initials } from "@/components/dashboard-sidebar";
import { DashboardWizard } from "@/components/dashboard-wizard";
import { DueDiligencePackage } from "@/components/due-diligence-package";
import { EvidenceUploadForm } from "@/components/evidence-upload-form";
import { RedTeamCard } from "@/components/red-team-card";
import { RerunAssessment } from "@/components/rerun-assessment";
import { SignOutButton } from "@/components/sign-out-button";
import { ASSESSMENT_EVIDENCE_TYPE, EVIDENCE_TYPE_LABELS, fileNameFromPath, toEvidenceType } from "@/lib/evidence";
import { GATE_REQUIREMENTS, toIncubationMonth } from "@/lib/gates";
import { formatNad, INSTRUMENTS, isInstrument, MOCK_ENTREPRENEUR_SECTOR } from "@/lib/investors";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const TIME_ZONE = "Africa/Windhoek";

// Row shape returned by the match_investors database function.
type MatchedInvestor = {
  investor_id: string;
  email: string | null;
  preferred_sector: string;
  max_investment_amount: number;
  preferred_instrument: string;
};

function greeting(now: Date): string {
  const hour = Number(new Intl.DateTimeFormat("en", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(now));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

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

  const currentMonth = toIncubationMonth(profile?.current_month ?? 1);
  const readinessScore: number = profile?.readiness_score ?? 0;
  const email = user.email ?? "";
  const name: string = user.user_metadata?.full_name || email.split("@")[0] || "Founder";
  const firstName = name.split(/\s+/)[0];
  const businessName: string | null = profile?.business_name || null;
  const hasAssessment = readinessScore > 0 || Boolean(profile?.roadmap) || Boolean(profile?.red_team_flaws);

  // Step 3 (and the investors in it) unlocks once the entrepreneur reaches the final incubation month.
  const fundingUnlocked = (profile?.current_month ?? 1) >= 3;
  const { data: matches, error: matchError } = fundingUnlocked
    ? await supabase.rpc("match_investors", { p_sector: MOCK_ENTREPRENEUR_SECTOR })
    : { data: null, error: null };
  const matchedInvestors = (matches ?? []) as MatchedInvestor[];

  const thisMonth = (evidence ?? []).filter((item) => item.month === currentMonth);
  const checkedCount = thisMonth.filter((item) => item.ai_verification_status === "verified").length;
  const needsAttentionCount = thisMonth.length - checkedCount;

  const now = new Date();
  const today = new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(now);

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
      <div className="grid min-h-screen grid-cols-[72px_minmax(0,1fr)] md:grid-cols-[248px_minmax(0,1fr)]">
        <DashboardSidebar name={name} email={email} />

        <main className="min-w-0">
          <header className="flex h-[66px] items-center justify-between gap-5 border-b border-line bg-white px-4 md:h-[76px] md:px-8">
            <p className="min-w-0 truncate text-sm text-muted">
              Incubation Programme <span className="text-[#c0c8d6]">/</span>{" "}
              <span className="font-bold text-ink">Month {currentMonth} of 3</span>
            </p>
            <div className="flex items-center gap-3 md:gap-5">
              <div className="flex items-center gap-[9px] text-sm font-bold">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e5ff] text-xs font-extrabold text-[#5146b8]">
                  {initials(name)}
                </div>
                <span className="hidden md:inline">{name}</span>
              </div>
              <SignOutButton />
            </div>
          </header>

          <div className="mx-auto flex max-w-[980px] flex-col gap-8 px-4 py-7 md:px-8 md:py-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[24px] font-extrabold tracking-[-0.8px] md:text-[28px]">
                  {greeting(now)}, {firstName}
                </h1>
                <p className="mt-1.5 text-[15px] text-muted">
                  {businessName ? `Let's get ${businessName} ready for investment.` : "Let's get your business ready for investment."}
                </p>
              </div>
              <p className="hidden pt-2 text-xs text-[#8290a5] md:block">{today}</p>
            </div>

            {(error || evidenceError) && (
              <p className="rounded-2xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger">
                We couldn&apos;t load all your information: {(error ?? evidenceError)?.message}
              </p>
            )}

            <ScoreBanner score={readinessScore} month={currentMonth} />

            <DashboardWizard steps={steps} initialStep={hasAssessment ? 2 : 1} />
          </div>
        </main>
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

function CountChip({
  label,
  count,
  icon: Icon,
  tone,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "good" | "bad";
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl px-4 py-3.5", tone === "good" ? "bg-success-soft" : "bg-danger-soft")}>
      <Icon className={cn("h-5 w-5 shrink-0", tone === "good" ? "text-success" : "text-danger")} />
      <div className="min-w-0">
        <p className="text-2xl leading-none font-extrabold">{count}</p>
        <p className="mt-1 truncate text-xs font-bold text-[#3c4a62]">{label}</p>
      </div>
    </div>
  );
}

type EvidenceRow = {
  id: string;
  file_url: string;
  evidence_type: string;
  month: number;
  ai_verification_status: string;
  ai_feedback: string | null;
  reconciliation_status?: string | null;
  created_at: string;
};

function EvidenceList({ evidence }: { evidence: EvidenceRow[] }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-bold text-ink">Your uploaded documents</h4>
      {!evidence.length ? (
        <p className="py-2 text-sm text-muted">No documents uploaded yet.</p>
      ) : (
        <ul>
          {evidence.map((item) => {
            const checked = item.ai_verification_status === "verified";
            const fraudAlert = item.reconciliation_status === "failed";
            const type = toEvidenceType(item.evidence_type);
            return (
              <li key={item.id} className="border-b border-[#f0f2f7] py-4 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                      checked ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                    )}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex min-w-0 flex-wrap items-center gap-1.5">
                      <b className="truncate text-sm">{fileNameFromPath(item.file_url)}</b>
                      {fraudAlert && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ff1f3d] px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white uppercase shadow-[0_0_0_3px_#ff1f3d26]">
                          <Siren className="h-3 w-3" /> Fraud Alert
                        </span>
                      )}
                    </div>
                    <small className="text-xs text-[#8b98aa]">
                      {type ? EVIDENCE_TYPE_LABELS[type] : "Document"} · Month {item.month} · {formatDate(item.created_at)}
                      {item.reconciliation_status === "reconciled" && <span className="text-success"> · Reconciled</span>}
                    </small>
                  </div>
                  <b className={cn("shrink-0 text-sm", checked ? "text-success" : "text-danger")}>
                    {checked ? "Checked" : "Needs attention"}
                  </b>
                </div>
                {fraudAlert && item.ai_feedback && (
                  <p className="mt-2.5 rounded-xl border border-[#ff1f3d]/30 bg-danger-soft px-3 py-2 text-sm leading-relaxed text-[#9b2a3d] sm:ml-14">
                    {item.ai_feedback}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  }).format(new Date(value));
}
