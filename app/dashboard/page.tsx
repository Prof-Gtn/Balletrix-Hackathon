import { redirect } from "next/navigation";
import { Briefcase, Calculator, CheckCircle2, FileText, Gauge, Handshake, Layers, ShieldAlert, ShieldCheck, Siren, Target } from "lucide-react";
import { AssessmentForm } from "@/components/assessment-form";
import { DCFCalculator } from "@/components/dcf-calculator";
import { DashboardSidebar, initials } from "@/components/dashboard-sidebar";
import { DueDiligencePackage } from "@/components/due-diligence-package";
import { EvidenceUploadForm } from "@/components/evidence-upload-form";
import { RedTeamCard } from "@/components/red-team-card";
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
    // "*" rather than a column list: red_team_flaws and reconciliation_status only exist once the
    // red team migration has run, and naming them before that would fail the whole query.
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

  // Investors are only shown once the entrepreneur has reached the final incubation month.
  const showMatches = (profile?.current_month ?? 1) >= 3;
  const { data: matches, error: matchError } = showMatches
    ? await supabase.rpc("match_investors", { p_sector: MOCK_ENTREPRENEUR_SECTOR })
    : { data: null, error: null };
  const matchedInvestors = (matches ?? []) as MatchedInvestor[];

  const thisMonth = (evidence ?? []).filter((item) => item.month === currentMonth);
  const verifiedCount = thisMonth.filter((item) => item.ai_verification_status === "verified").length;
  const flaggedCount = thisMonth.length - verifiedCount;

  const now = new Date();
  const today = new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(now);

  return (
    <div className="grid min-h-screen grid-cols-[72px_minmax(0,1fr)] md:grid-cols-[248px_minmax(0,1fr)]">
      <DashboardSidebar name={name} email={email} />

      <main className="min-w-0">
        <header className="flex h-[66px] items-center justify-between gap-5 border-b border-line bg-white px-3.5 md:h-[76px] md:px-[22px] min-[1100px]:px-8">
          <p className="min-w-0 truncate text-xs text-muted">
            Incubation Programme <span className="text-[#c0c8d6]">/</span>{" "}
            <span className="font-semibold text-ink">Month {currentMonth} of 3</span>
          </p>
          <div className="flex items-center gap-2.5 md:gap-5">
            <div className="flex items-center gap-[9px] text-xs font-bold">
              <div className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#e8e5ff] text-xs font-extrabold text-[#5146b8]">
                {initials(name)}
              </div>
              <span className="hidden md:inline">{name}</span>
            </div>
            <SignOutButton />
          </div>
        </header>

        <div id="overview" className="mx-auto max-w-[1600px] scroll-mt-4 px-3.5 py-[22px] md:px-[22px] md:py-[25px] min-[1100px]:px-8 min-[1100px]:py-[30px]">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="mb-[7px] text-[21px] font-bold tracking-[-0.8px] md:text-[25px]">
                {greeting(now)}, {firstName}
              </h1>
              <p className="text-[13px] text-muted">
                {businessName ? `Here's where ${businessName} stands today.` : "Here's where your business stands today."}
              </p>
            </div>
            <p className="hidden pt-2 text-[11px] text-[#8290a5] md:block">{today}</p>
          </div>

          {(error || evidenceError) && (
            <p className="mb-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              Could not load your data: {(error ?? evidenceError)?.message}
            </p>
          )}

          <div className="mb-[18px] grid grid-cols-2 gap-2.5 sm:gap-4 min-[1100px]:grid-cols-4">
            <StatCard label="Current level" icon={Layers} tone="purple" value={`Month ${currentMonth}`}>
              {currentMonth < 3 ? (
                <>
                  <span className="font-bold text-brand">{4 - currentMonth} gates</span> to go
                </>
              ) : (
                <span className="font-bold text-brand">Final gate</span>
              )}
            </StatCard>
            <StatCard label="Investment Readiness Score" icon={Gauge} tone="green" value={`${readinessScore}/100`}>
              Gate: {GATE_REQUIREMENTS[currentMonth].summary}
            </StatCard>
            <StatCard label="Checked Documents" icon={ShieldCheck} tone="blue" value={String(verifiedCount)}>
              {verifiedCount > 0 ? <span className="font-bold text-success">+15 bonus active</span> : "None this month"}
            </StatCard>
            <StatCard label="Needs Attention" icon={ShieldAlert} tone="red" value={String(flaggedCount)}>
              {flaggedCount > 0 ? <span className="font-bold text-danger">Needs review</span> : "Nothing flagged"}
            </StatCard>
          </div>

          <div className="grid gap-[18px] min-[1100px]:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
            <section id="assessment" className={cn(panelClass, "scroll-mt-4")}>
              <PanelHead title="AI Investment Audit" />
              <AssessmentForm currentMonth={currentMonth} />
              <div className="mt-5">
                <RedTeamCard data={profile?.red_team_flaws ?? null} />
              </div>
            </section>

            <div className="flex min-w-0 flex-col gap-[18px]">
              <section id="evidence" className={cn(panelClass, "scroll-mt-4")}>
                <PanelHead title="Evidence" />
                <EvidenceUploadForm />

                <h4 className="mt-6 mb-1 text-xs font-bold text-[#3c4a62]">Submitted evidence</h4>
                {!evidence?.length ? (
                  <p className="py-3 text-[13px] text-muted">No evidence uploaded yet.</p>
                ) : (
                  <ul>
                    {evidence.map((item) => {
                      const verified = item.ai_verification_status === "verified";
                      const fraudAlert = item.reconciliation_status === "failed";
                      const type = toEvidenceType(item.evidence_type);
                      return (
                        <li key={item.id} className="border-b border-[#f0f2f7] py-[13px] last:border-b-0 last:pb-0">
                          <div className="flex items-center gap-[11px]">
                            <div
                              className={cn(
                                "grid h-[39px] w-[39px] shrink-0 place-items-center rounded-[13px]",
                                verified ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                              )}
                            >
                              <FileText className="h-[15px] w-[15px]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-[5px] flex min-w-0 items-center gap-1.5">
                                <b className="truncate text-xs">{fileNameFromPath(item.file_url)}</b>
                                {fraudAlert && (
                                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ff1f3d] px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-white uppercase shadow-[0_0_0_3px_#ff1f3d26]">
                                    <Siren className="h-3 w-3" /> Fraud Alert
                                  </span>
                                )}
                              </div>
                              <small className="text-[10px] text-[#8b98aa]">
                                {type ? EVIDENCE_TYPE_LABELS[type] : "Document"} · Month{" "}
                                {item.month}
                                {item.reconciliation_status === "reconciled" && <span className="text-success"> · Reconciled</span>}
                              </small>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <b className={cn("mb-[5px] block text-xs", verified ? "text-success" : "text-danger")}>
                                {verified ? "Verified" : "Flagged"}
                              </b>
                              <small className="text-[9px] text-[#96a2b3]">{formatDate(item.created_at)}</small>
                            </div>
                          </div>
                          {fraudAlert && item.ai_feedback && (
                            <p className="mt-2 ml-[50px] rounded-lg border border-[#ff1f3d]/30 bg-danger-soft px-2.5 py-1.5 text-[11px] leading-relaxed text-[#9b2a3d]">
                              {item.ai_feedback}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="relative overflow-hidden rounded-2xl bg-[#151d35] p-[22px] text-white">
                <div aria-hidden className="absolute right-[18px] -bottom-3 rotate-[-15deg] text-[70px] font-black opacity-[0.18]">
                  M
                </div>
                <h3 className="mb-[9px] max-w-[240px] text-lg leading-[1.3] font-bold">Unlock Month {currentMonth}</h3>
                <p className="mb-4 max-w-[260px] text-[11px] leading-[1.6] text-[#c3c8dd]">
                  This gate needs {GATE_REQUIREMENTS[currentMonth].sentence}. A verified contract, bank statement or invoice adds +15 readiness and
                  lifts scalability.
                </p>
                <a
                  href="#evidence"
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[11px] bg-brand px-3.5 text-[11px] font-semibold shadow-brand transition hover:-translate-y-px hover:brightness-105"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Upload evidence
                </a>
              </section>
            </div>
          </div>

          <section id="package" className={cn(panelClass, "mt-[18px] scroll-mt-4")}>
            <div className="mb-[22px] flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold tracking-[-0.2px]">Due Diligence Package</h3>
            </div>
            <DueDiligencePackage />
          </section>

          <section id="valuation" className={cn(panelClass, "mt-[18px] scroll-mt-4")}>
            <div className="mb-[22px] flex items-center gap-2">
              <Calculator className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold tracking-[-0.2px]">AI-Assisted DCF Valuation</h3>
            </div>
            <DCFCalculator />
          </section>

          {showMatches && (
            <section id="investors" className={cn(panelClass, "mt-[18px] scroll-mt-4")}>
              <div className="mb-[22px] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Handshake className="h-4 w-4 text-brand" />
                  <h3 className="text-sm font-bold tracking-[-0.2px]">Matched Investors</h3>
                </div>
                <span className="rounded-lg border border-line px-2.5 py-1 text-[10px] text-[#68768c]">
                  Sector: {MOCK_ENTREPRENEUR_SECTOR}
                </span>
              </div>
              {matchError ? (
                <p className="text-xs text-danger">Could not load matched investors: {matchError.message}</p>
              ) : !matchedInvestors.length ? (
                <p className="text-[13px] text-muted">No investors are looking for {MOCK_ENTREPRENEUR_SECTOR} businesses yet.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 min-[1100px]:grid-cols-3">
                  {matchedInvestors.map((investor) => (
                    <li key={investor.investor_id} className="flex items-center gap-[11px] rounded-xl border border-[#f0f2f7] p-3.5">
                      <div className="grid h-[39px] w-[39px] shrink-0 place-items-center rounded-[13px] bg-brand-soft text-xs font-extrabold text-brand">
                        {initials(investor.email?.split("@")[0] ?? "Investor")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <b className="mb-[5px] block truncate text-xs">{investor.email ?? "MulaStream investor"}</b>
                        <small className="text-[10px] text-[#8b98aa]">
                          {isInstrument(investor.preferred_instrument)
                            ? INSTRUMENTS[investor.preferred_instrument]
                            : investor.preferred_instrument}{" "}
                          · {investor.preferred_sector}
                        </small>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <b className="mb-[5px] block text-xs text-success">{formatNad(Number(investor.max_investment_amount))}</b>
                        <small className="text-[9px] text-[#96a2b3]">max ticket</small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

const panelClass = "min-w-0 rounded-2xl border border-[#edf0f6] bg-white p-4 shadow-card md:p-[21px]";

function PanelHead({ title }: { title: string }) {
  return (
    <div className="mb-[22px] flex items-center gap-2">
      <Target className="h-4 w-4 text-brand" />
      <h3 className="text-sm font-bold tracking-[-0.2px]">{title}</h3>
    </div>
  );
}

const TONES = {
  purple: "bg-brand-soft text-brand",
  green: "bg-success-soft text-success",
  red: "bg-danger-soft text-danger",
  blue: "bg-info-soft text-info",
};

function StatCard({
  label,
  icon: Icon,
  tone,
  value,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof TONES;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-[#edf0f6] bg-white p-[13px] shadow-card sm:p-[15px] md:p-5">
      <div className="flex items-start justify-between gap-2 text-[10px] text-[#64728a] sm:text-[11px] md:items-center">
        {label}
        <span className={cn("grid h-[30px] w-[30px] shrink-0 place-items-center rounded-xl md:h-9 md:w-9", TONES[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="my-[9px] text-[17px] font-extrabold tracking-[-0.4px] whitespace-nowrap sm:text-[19px] md:mt-3.5 md:text-[clamp(19px,2vw,25px)]">
        {value}
      </div>
      <div className="truncate text-[10px] text-[#8490a4] sm:text-[11px]">{children}</div>
    </article>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TIME_ZONE,
  })
    .format(new Date(value))
    .replace(",", " ·");
}
