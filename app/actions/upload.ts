"use server";

import { AUTO_VERIFIED_TYPES, EVIDENCE_TYPE_LABELS, toEvidenceType, type EvidenceType } from "@/lib/evidence";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "evidence";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export type EvidenceResult = { ok: true; message: string } | { ok: false; error: string };

// Hackathon stand-in for AI document verification: trusts the evidence type the user selects.
function simulateVerification(type: EvidenceType): "verified" | "flagged" {
  return AUTO_VERIFIED_TYPES.includes(type) ? "verified" : "flagged";
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("current_month")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) return { ok: false, error: `Could not load your profile: ${profileError.message}` };

  // Stored as <user id>/<timestamp>-<file name>; the dashboard shows the part after the timestamp.
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
  const path = `${user.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  // Until the 'evidence' bucket exists, keep going with metadata only so the flow can still be demoed.
  const simulated = Boolean(uploadError);
  if (uploadError) console.warn(`Evidence upload to '${BUCKET}' failed, saving metadata only:`, uploadError.message);

  const status = simulateVerification(evidenceType);

  const { error: insertError } = await supabase.from("evidence_submissions").insert({
    user_id: user.id,
    month: profile?.current_month ?? 1,
    evidence_type: evidenceType,
    // Without storage there is no file to point at, so keep just its name for the UI.
    file_url: simulated ? file.name : path,
    ai_verification_status: status,
    ai_feedback:
      status === "verified"
        ? `${EVIDENCE_TYPE_LABELS[evidenceType]} accepted as proof of traction.`
        : `${EVIDENCE_TYPE_LABELS[evidenceType]} is pending human review. Signed contracts, bank statements and invoices are verified automatically.`,
  });
  if (insertError) return { ok: false, error: `Could not save your evidence: ${insertError.message}` };

  const outcome = status === "verified" ? "verified" : "flagged for human review";
  return {
    ok: true,
    message: `"${file.name}" was ${outcome}.${simulated ? " (File storage is not set up yet, so the file itself was not stored.)" : ""}`,
  };
}
