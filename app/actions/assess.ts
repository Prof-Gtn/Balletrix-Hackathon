"use server";

import { assessBusiness, NO_BONUS, type Assessment, type ScoreBonus, type SubmittedEvidence } from "@/lib/claude";
import { ASSESSMENT_EVIDENCE_TYPE, EVIDENCE_TYPE_LABELS, fileNameFromPath, isEvidenceType } from "@/lib/evidence";
import { createClient } from "@/lib/supabase/server";

const MAX_MONTH = 3;
// Simulates the AI re-evaluating the business once verified evidence exists for the current month:
// a signed contract, bank statement or invoice proves real traction, so it lifts scalability too.
// The scalability floor matches the Month 1 gate so the demo unlock doesn't depend on the model's exact score.
const VERIFIED_EVIDENCE_BONUS: ScoreBonus = { readiness: 15, scalability: 2, minScalability: 5 };

export type AssessmentResult =
  | { ok: true; result: Assessment; evidenceBonus: ScoreBonus }
  // `result` is present when the AI assessment succeeded but saving it failed, so the user doesn't lose it.
  | { ok: false; error: string; result?: Assessment };

export async function runAssessment(businessDescription: string): Promise<AssessmentResult> {
  const description = businessDescription?.trim();
  if (!description) return { ok: false, error: "Please describe your business." };

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "You must be logged in to run an assessment." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("current_month")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) return { ok: false, error: `Could not load your profile: ${profileError.message}` };

  const currentMonth: number = profile?.current_month ?? 1;

  // Uploaded documents only; assessment rows are also stored in this table.
  const { data: uploads, error: uploadsError } = await supabase
    .from("evidence_submissions")
    .select("evidence_type, file_url, month, ai_verification_status")
    .eq("user_id", user.id)
    .neq("evidence_type", ASSESSMENT_EVIDENCE_TYPE)
    .not("file_url", "is", null)
    .order("created_at", { ascending: true });
  if (uploadsError) return { ok: false, error: `Could not check your evidence: ${uploadsError.message}` };

  const evidence: SubmittedEvidence[] = (uploads ?? []).map((row) => ({
    type: isEvidenceType(row.evidence_type) ? EVIDENCE_TYPE_LABELS[row.evidence_type] : "Document",
    fileName: fileNameFromPath(row.file_url),
    status: row.ai_verification_status === "verified" ? "verified" : "flagged",
    month: row.month,
  }));

  const hasVerifiedThisMonth = evidence.some((e) => e.month === currentMonth && e.status === "verified");
  const bonus = hasVerifiedThisMonth ? VERIFIED_EVIDENCE_BONUS : NO_BONUS;

  let result: Assessment;
  try {
    result = await assessBusiness(description, currentMonth, { bonus, evidence });
  } catch (error) {
    console.error("assessBusiness failed", error);
    return { ok: false, error: "The AI assessment failed. Please try again in a moment." };
  }

  const passed = result.gate_status === "PASSED";
  const disqualified = result.gate_status === "DISQUALIFIED";
  // assessBusiness never applies the bonus to a disqualified submission.
  const evidenceBonus = disqualified ? NO_BONUS : bonus;

  const { error: evidenceError } = await supabase.from("evidence_submissions").insert({
    user_id: user.id,
    month: currentMonth,
    evidence_type: ASSESSMENT_EVIDENCE_TYPE,
    ai_verification_status: passed ? "verified" : "flagged",
    ai_feedback: disqualified ? `DISQUALIFIED: ${result.evidence_flags.disqualification_reason}` : result.gate_feedback,
  });
  if (evidenceError) {
    return { ok: false, error: `Assessment completed but could not be saved: ${evidenceError.message}`, result };
  }

  // The score always reflects the latest assessment; the month only advances when the gate is passed.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      readiness_score: result.overall_score,
      ...(passed && { current_month: Math.min(currentMonth + 1, MAX_MONTH) }),
    })
    .eq("id", user.id);
  if (updateError) {
    return { ok: false, error: `Assessment completed but your progress could not be saved: ${updateError.message}`, result };
  }

  return { ok: true, result, evidenceBonus };
}
