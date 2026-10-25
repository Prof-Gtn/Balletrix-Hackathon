import { NextResponse, type NextRequest } from "next/server";
import { generateInvestmentMemo, type MemoEvidence } from "@/lib/claude";
import { ASSESSMENT_EVIDENCE_TYPE, EVIDENCE_TYPE_LABELS, fileNameFromPath, isEvidenceType } from "@/lib/evidence";
import { loadPreferredLanguage } from "@/lib/preferred-language";
import { createClient } from "@/lib/supabase/server";

type DueDiligenceData = {
  profile: { business_name: string | null; sector: string | null; readiness_score: number | null; current_month: number | null };
  evidence: {
    evidence_type: string;
    file_name: string;
    month: number;
    ai_verification_status: string;
    ai_feedback: string | null;
    created_at: string;
  }[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Investment Memorandum for an investment-ready startup, requested by an investor. Access is enforced
// in the database: startup_due_diligence() returns null unless the caller is an investor and the
// startup has reached Month 3.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { startupId?: unknown } | null;
  const startupId = typeof body?.startupId === "string" ? body.startupId : "";
  if (!UUID.test(startupId)) return NextResponse.json({ error: "Unknown startup." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  // The memo is written in the reading investor's language.
  const [{ data, error }, language] = await Promise.all([
    supabase.rpc("startup_due_diligence", { p_startup: startupId }),
    loadPreferredLanguage(supabase, user.id),
  ]);
  if (error) {
    console.error("startup_due_diligence failed", error);
    return NextResponse.json({ error: "We couldn't load this startup right now." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "This package is only available to investors." }, { status: 403 });

  const { profile, evidence } = data as DueDiligenceData;
  const memoEvidence: MemoEvidence[] = evidence.map((row) => {
    const isAssessment = row.evidence_type === ASSESSMENT_EVIDENCE_TYPE;
    return {
      kind: isAssessment ? "ai_assessment" : "uploaded_document",
      type: isAssessment ? "AI readiness assessment" : isEvidenceType(row.evidence_type) ? EVIDENCE_TYPE_LABELS[row.evidence_type] : "Document",
      // file_name is the last path segment (still prefixed); "x/" lets fileNameFromPath strip and decode it.
      fileName: row.file_name ? fileNameFromPath(`x/${row.file_name}`) : null,
      month: row.month,
      status: row.ai_verification_status,
      feedback: row.ai_feedback,
      submittedAt: row.created_at,
    };
  });

  try {
    const markdown = await generateInvestmentMemo(
      {
        businessName: profile.business_name,
        readinessScore: profile.readiness_score ?? 0,
        currentMonth: profile.current_month ?? 1,
      },
      memoEvidence,
      language
    );
    return NextResponse.json({ markdown });
  } catch (err) {
    console.error("generateInvestmentMemo (investor) failed", err);
    return NextResponse.json({ error: "The memo could not be generated. Please try again in a moment." }, { status: 502 });
  }
}
