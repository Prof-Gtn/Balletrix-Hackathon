"use server";

import { reconcileFinancials } from "@/lib/claude";
import { AUTO_VERIFIED_TYPES, EVIDENCE_TYPE_LABELS, toEvidenceType, type EvidenceType } from "@/lib/evidence";
import { extractPdfText, isPdf } from "@/lib/pdf";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// The storage bucket id, which is case-sensitive: uploads use the id, not the display name.
const BUCKET_NAME = "evidence";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export type EvidenceResult = { ok: true; message: string } | { ok: false; error: string };

// Hackathon stand-in for AI document verification: trusts the evidence type the user selects.
function simulateVerification(type: EvidenceType): "verified" | "flagged" {
  return AUTO_VERIFIED_TYPES.includes(type) ? "verified" : "flagged";
}

type ReconciliationStatus = "reconciled" | "failed" | "not_applicable" | null;

type EvidenceCheck = {
  status: "verified" | "flagged";
  reconciliationStatus: ReconciliationStatus;
  feedback: string;
};

// Financial reconciliation (fraud hunter) for bank statements: reads the PDF's text and asks the
// forensic accountant agent to check its deposits against the revenue the founder claims. A bank
// statement is only verified if it reconciles.
async function checkBankStatement(file: File, businessDescription: string): Promise<EvidenceCheck> {
  let text = "";
  if (isPdf(file)) {
    try {
      text = await extractPdfText(file);
    } catch (error) {
      console.error("PDF text extraction failed", error);
    }
  }
  if (!text) {
    return {
      status: "flagged",
      reconciliationStatus: "failed",
      feedback:
        "No readable text was found in this bank statement. Upload it as a text-based PDF exported from your bank, not a scan or photo.",
    };
  }

  try {
    const result = await reconcileFinancials(businessDescription, text);
    return {
      status: result.reconciled ? "verified" : "flagged",
      reconciliationStatus: result.reconciled ? "reconciled" : "failed",
      feedback: result.reason,
    };
  } catch (error) {
    // The agent couldn't run (e.g. an API error): leave reconciliation pending rather than raise a fraud alert.
    console.error("reconcileFinancials failed", error);
    return {
      status: "flagged",
      reconciliationStatus: null,
      feedback: "Automatic reconciliation could not run. This bank statement is pending review.",
    };
  }
}

async function checkEvidence(type: EvidenceType, file: File, businessDescription: string): Promise<EvidenceCheck> {
  if (type === "bank_statement") return checkBankStatement(file, businessDescription);

  const status = simulateVerification(type);
  return {
    status,
    reconciliationStatus: "not_applicable",
    feedback:
      status === "verified"
        ? `${EVIDENCE_TYPE_LABELS[type]} accepted as proof of traction.`
        : `${EVIDENCE_TYPE_LABELS[type]} is pending human review. Signed contracts, bank statements and invoices are verified automatically.`,
  };
}

export async function submitEvidence(formData: FormData): Promise<EvidenceResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Please choose a file to upload." };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "File is too large. The limit is 10 MB." };

  const evidenceType = toEvidenceType(formData.get("evidence_type"));
  if (!evidenceType) return { ok: false, error: "Please select an evidence type." };

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "You must be logged in to upload evidence." };

  // "*" so uploads still work if the business_description column's migration hasn't run.
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (profileError) return { ok: false, error: `Could not load your profile: ${profileError.message}` };

  // <user id>/<uuid>-<file name>: the UUID keeps names unique, and the user folder lets storage
  // policies restrict each user to their own files.
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
  const filePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, { contentType: file.type || undefined });
  if (uploadError) {
    // Surface the storage error as-is (e.g. an RLS policy violation or a size limit) so it can be diagnosed.
    console.error(`Evidence upload to '${BUCKET_NAME}' failed`, uploadError);
    return { ok: false, error: `Upload failed: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  // The Fraud Hunter checks a bank statement's deposits against the revenue the founder described.
  const check = await checkEvidence(evidenceType, file, String(profile?.business_description ?? ""));

  // Users can't write a "verified" row themselves (database trigger), so the server saves the checked
  // result with the service role, scoped to this user. Without the key it falls back to the user's session.
  const serverWriter = createAdminClient() ?? supabase;
  const { error: insertError } = await serverWriter.from("evidence_submissions").insert({
    user_id: user.id,
    month: profile?.current_month ?? 1,
    evidence_type: evidenceType,
    file_url: publicUrl,
    ai_verification_status: check.status,
    ai_feedback: check.feedback,
    reconciliation_status: check.reconciliationStatus,
  });
  if (insertError) {
    // Best effort: don't leave an orphaned file in storage when the database row couldn't be saved.
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    return { ok: false, error: `Could not save your evidence: ${insertError.message}` };
  }

  if (check.reconciliationStatus === "failed") {
    return { ok: true, message: `"${file.name}" was uploaded but failed financial reconciliation: ${check.feedback}` };
  }
  const outcome =
    check.reconciliationStatus === "reconciled"
      ? "reconciled and verified"
      : check.status === "verified"
        ? "verified"
        : "flagged for human review";
  return { ok: true, message: `"${file.name}" was uploaded and ${outcome}.` };
}
