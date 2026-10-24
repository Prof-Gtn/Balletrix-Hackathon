import { NextResponse } from "next/server";
import { generateInvestmentMemo, type MemoEvidence } from "@/lib/claude";
import { ASSESSMENT_EVIDENCE_TYPE, EVIDENCE_TYPE_LABELS, fileNameFromPath, isEvidenceType } from "@/lib/evidence";
import { createClient } from "@/lib/supabase/server";

// POST, not GET: each call runs the AI model, so it shouldn't be triggered by prefetching or crawlers.
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "You must be logged in to generate a package." }, { status: 401 });
  }

  const [{ data: profile, error: profileError }, { data: rows, error: evidenceError }] = await Promise.all([
    supabase.from("profiles").select("business_name, readiness_score, current_month").eq("id", user.id).maybeSingle(),
    supabase
      .from("evidence_submissions")
      .select("evidence_type, file_url, month, ai_verification_status, ai_feedback, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);
  if (profileError || evidenceError) {
    const message = (profileError ?? evidenceError)?.message;
    return NextResponse.json({ error: `Could not load your data: ${message}` }, { status: 500 });
  }

  const evidence: MemoEvidence[] = (rows ?? []).map((row) => {
    const isAssessment = row.evidence_type === ASSESSMENT_EVIDENCE_TYPE;
    return {
      kind: isAssessment ? "ai_assessment" : "uploaded_document",
      type: isAssessment
        ? "AI readiness assessment"
        : isEvidenceType(row.evidence_type)
          ? EVIDENCE_TYPE_LABELS[row.evidence_type]
          : "Document",
      fileName: row.file_url ? fileNameFromPath(row.file_url) : null,
      month: row.month,
      status: row.ai_verification_status,
      feedback: row.ai_feedback,
      submittedAt: row.created_at,
    };
  });

  try {
    const markdown = await generateInvestmentMemo(
      {
        businessName: profile?.business_name || null,
        readinessScore: profile?.readiness_score ?? 0,
        currentMonth: profile?.current_month ?? 1,
      },
      evidence
    );
    return NextResponse.json({ markdown });
  } catch (error) {
    console.error("generateInvestmentMemo failed", error);
    return NextResponse.json({ error: "The memo could not be generated. Please try again in a moment." }, { status: 502 });
  }
}
