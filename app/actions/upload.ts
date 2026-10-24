"use server";

import { AUTO_VERIFIED_TYPES, EVIDENCE_TYPE_LABELS, toEvidenceType, type EvidenceType } from "@/lib/evidence";
import { createClient } from "@/lib/supabase/server";

// Hardcoded while debugging "Bucket not found"; Supabase bucket ids are case-sensitive.
const BUCKET_NAME = 'Evidence';
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
  // DEBUG: shows the buckets this user's session can see. An empty list can just mean storage.buckets
  // has no SELECT policy for this user, not that no bucket exists.
  const { data: buckets } = await supabase.storage.listBuckets(); console.log('DEBUG: Available buckets:', buckets?.map(b => b.name));

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

  // <user id>/<uuid>-<file name>: the UUID keeps names unique, and the user folder lets storage
  // policies restrict each user to their own files.
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
  const filePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  console.log('DEBUG: Attempting upload to bucket:', JSON.stringify(BUCKET_NAME));
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

  const status = simulateVerification(evidenceType);

  const { error: insertError } = await supabase.from("evidence_submissions").insert({
    user_id: user.id,
    month: profile?.current_month ?? 1,
    evidence_type: evidenceType,
    file_url: publicUrl,
    ai_verification_status: status,
    ai_feedback:
      status === "verified"
        ? `${EVIDENCE_TYPE_LABELS[evidenceType]} accepted as proof of traction.`
        : `${EVIDENCE_TYPE_LABELS[evidenceType]} is pending human review. Signed contracts, bank statements and invoices are verified automatically.`,
  });
  if (insertError) {
    // Best effort: don't leave an orphaned file in storage when the database row couldn't be saved.
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    return { ok: false, error: `Could not save your evidence: ${insertError.message}` };
  }

  const outcome = status === "verified" ? "verified" : "flagged for human review";
  return { ok: true, message: `"${file.name}" was uploaded and ${outcome}.` };
}
