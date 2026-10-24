"use server";

import {
  assessBusiness,
  NO_BONUS,
  runDevilsAdvocate,
  type Assessment,
  type ScoreBonus,
  type SubmittedEvidence,
} from "@/lib/claude";
import { ASSESSMENT_EVIDENCE_TYPE, EVIDENCE_TYPE_LABELS, fileNameFromPath, isEvidenceType } from "@/lib/evidence";
import { extractPdfText, isPdf } from "@/lib/pdf";
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

const MAX_PLAN_BYTES = 10 * 1024 * 1024;
// About 60 pages of text; longer plans are rejected rather than silently cut short.
const MAX_PLAN_CHARS = 200_000;

// The business plan to assess: an uploaded file takes priority over the typed description.
async function readBusinessPlan(formData: FormData): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const file = formData.get("business_plan");

  if (file instanceof File && file.size > 0) {
    if (!isPdf(file)) {
      return { ok: false, error: "Please upload a PDF. Word documents can't be read yet, so save your plan as a PDF first." };
    }
    if (file.size > MAX_PLAN_BYTES) return { ok: false, error: "That file is too large. The limit is 10 MB." };

    let text = "";
    try {
      text = await extractPdfText(file);
    } catch (error) {
      console.error("Business plan text extraction failed", error);
    }
    if (!text) {
      return {
        ok: false,
        error: "We couldn't read any text in that PDF. It may be a scan or photo. Try a text-based PDF, or paste your plan instead.",
      };
    }
    if (text.length > MAX_PLAN_CHARS) {
      return { ok: false, error: "That business plan is too long. Please upload a shorter version (about 60 pages at most)." };
    }
    return { ok: true, text };
  }

  const description = String(formData.get("description") ?? "").trim();
  if (!description) return { ok: false, error: "Please describe your business or upload your business plan." };
  return { ok: true, text: description };
}

export async function runAssessment(formData: FormData): Promise<AssessmentResult> {
  const plan = await readBusinessPlan(formData);
  if (!plan.ok) return plan;
  const description = plan.text;

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

  // The Devil's Advocate runs alongside the main assessment to save time, but its result is only
  // saved once the main assessment has succeeded.
  const [assessment, redTeam] = await Promise.allSettled([
    assessBusiness(description, currentMonth, { bonus, evidence }),
    runDevilsAdvocate(description),
  ]);

  if (assessment.status === "rejected") {
    console.error("assessBusiness failed", assessment.reason);
    return { ok: false, error: "The AI assessment failed. Please try again in a moment." };
  }
  const result: Assessment = assessment.value;

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

  // Saved separately so a red team failure (or a missing red_team_flaws column) never blocks the
  // score and month update above. The dashboard keeps showing the previous critique in that case.
  if (redTeam.status === "fulfilled") {
    const { error: redTeamError } = await supabase
      .from("profiles")
      .update({ red_team_flaws: redTeam.value })
      .eq("id", user.id);
    if (redTeamError) console.error("Saving red_team_flaws failed", redTeamError);
  } else {
    console.error("runDevilsAdvocate failed", redTeam.reason);
  }

  return { ok: true, result, evidenceBonus };
}
