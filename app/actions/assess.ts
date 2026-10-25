"use server";

import {
  assessBusiness,
  NO_BONUS,
  runDevilsAdvocate,
  validateDocument,
  type Assessment,
  type ScoreBonus,
  type SubmittedEvidence,
} from "@/lib/claude";
import { DocumentReadError, extractDocumentText } from "@/lib/documents";
import { ASSESSMENT_EVIDENCE_TYPE, EVIDENCE_TYPE_LABELS, fileNameFromPath, isEvidenceType } from "@/lib/evidence";
import { loadPreferredLanguage } from "@/lib/preferred-language";
import type { RedTeamReport } from "@/lib/red-team";
import { createAdminClient } from "@/lib/supabase/admin";
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
// Less than this from a file usually means a scanned image with no text layer.
const MIN_EXTRACTED_CHARS = 50;
// About 60 pages of text; longer plans are rejected rather than silently cut short.
const MAX_PLAN_CHARS = 200_000;

const UNREADABLE_DOCUMENT =
  "We couldn't read the text in this document. Please make sure it is a text-based PDF or Word document, not a scanned image.";
const NOTHING_TO_ASSESS = "Please type a description or upload a document before running the assessment.";

type BusinessPlan = { ok: true; text: string; fromFile: boolean } | { ok: false; error: string };

// The business plan to assess: an uploaded file takes priority over the typed description.
async function readBusinessPlan(formData: FormData): Promise<BusinessPlan> {
  const file = formData.get("business_plan");

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_PLAN_BYTES) return { ok: false, error: "That file is too large. The limit is 10 MB." };

    let text = "";
    try {
      text = await extractDocumentText(file);
    } catch (error) {
      if (error instanceof DocumentReadError) return { ok: false, error: error.message };
      console.error("Business plan text extraction failed", error);
    }
    if (text.length < MIN_EXTRACTED_CHARS) return { ok: false, error: UNREADABLE_DOCUMENT };
    if (text.length > MAX_PLAN_CHARS) {
      return { ok: false, error: "That document is too long. Please upload a shorter version (about 60 pages at most)." };
    }
    return { ok: true, text, fromFile: true };
  }

  const description = String(formData.get("description") ?? "").trim();
  if (!description) return { ok: false, error: NOTHING_TO_ASSESS };
  return { ok: true, text: description, fromFile: false };
}

// "It is a recipe." -> "It is a recipe" so it reads naturally inside the error sentence.
function asClause(reason: string): string {
  return reason.trim().replace(/[.!\s]+$/, "") || "It doesn't describe a business";
}

export async function runAssessment(formData: FormData): Promise<AssessmentResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "You must be logged in to run an assessment." };

  const plan = await readBusinessPlan(formData);
  if (!plan.ok) return plan;
  const description = plan.text;

  // The bouncer: stop school assignments, recipes and other unrelated text before they get a score.
  try {
    const validation = await validateDocument(description);
    if (!validation.is_valid) {
      const what = plan.fromFile ? "you uploaded something" : "what you wrote";
      return {
        ok: false,
        error:
          `It looks like ${what} isn't a business plan. ${asClause(validation.reason)}. ` +
          "Please upload a document that describes what you sell, who buys it, and how you make money.",
      };
    }
  } catch (error) {
    console.error("validateDocument failed", error);
    return { ok: false, error: "We couldn't check your document right now. Please try again in a moment." };
  }

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

  // The AI writes the assessment and Tough Love card in the user's chosen language.
  const language = await loadPreferredLanguage(supabase, user.id);

  const hasVerifiedThisMonth = evidence.some((e) => e.month === currentMonth && e.status === "verified");
  const bonus = hasVerifiedThisMonth ? VERIFIED_EVIDENCE_BONUS : NO_BONUS;

  // Both agents run in parallel. A Tough Love (red team) failure is caught so it can't cancel the score.
  let result: Assessment;
  let redTeam: RedTeamReport | null;
  try {
    [result, redTeam] = await Promise.all([
      assessBusiness(description, currentMonth, { bonus, evidence, language }),
      runDevilsAdvocate(description, language).catch((error) => {
        console.error("runDevilsAdvocate failed", error);
        return null;
      }),
    ]);
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
  // Users can't change these two columns themselves (database trigger), so the server writes them with
  // the service role, scoped to this user. Without the key it falls back to the user's own session.
  const progressWriter = createAdminClient() ?? supabase;
  const { error: updateError } = await progressWriter
    .from("profiles")
    .update({
      readiness_score: result.overall_score,
      ...(passed && { current_month: Math.min(currentMonth + 1, MAX_MONTH) }),
    })
    .eq("id", user.id);
  if (updateError) {
    return { ok: false, error: `Assessment completed but your progress could not be saved: ${updateError.message}`, result };
  }

  // The action plan and Tough Love card are saved separately, so a missing column (migration not run)
  // or a red team failure never blocks the score and month update above.
  const { error: roadmapError } = await supabase.from("profiles").update({ roadmap: result.roadmap }).eq("id", user.id);
  if (roadmapError) console.error("Saving roadmap failed", roadmapError);

  if (redTeam) {
    const { error: redTeamError } = await supabase.from("profiles").update({ red_team_flaws: redTeam }).eq("id", user.id);
    if (redTeamError) console.error("Saving red_team_flaws failed", redTeamError);
  }

  return { ok: true, result, evidenceBonus };
}
