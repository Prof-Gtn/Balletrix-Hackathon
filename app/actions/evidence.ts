"use server";

import { revalidatePath } from "next/cache";
import { ASSESSMENT_EVIDENCE_TYPE } from "@/lib/evidence";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Same bucket as app/actions/upload.ts. The id is case-sensitive.
const BUCKET_NAME = "evidence";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DeleteEvidenceResult = { ok: true } | { ok: false; error: string };

// The storage path inside the bucket, from a saved public URL
// (".../storage/v1/object/public/evidence/<user id>/<uuid>-<name>"). Null for rows without a stored file.
function storagePath(fileUrl: string | null): string | null {
  if (!fileUrl) return null;
  const marker = `/object/public/${BUCKET_NAME}/`;
  const at = fileUrl.indexOf(marker);
  if (at === -1) return null;
  try {
    return decodeURIComponent(fileUrl.slice(at + marker.length).split("?")[0]);
  } catch {
    return null;
  }
}

// Deletes one of the signed-in user's uploaded documents: the evidence_submissions row and its file in
// storage. The file location is read from the user's own row, never taken from the browser, so a
// request can't point at someone else's file.
export async function deleteEvidence(evidenceId: string): Promise<DeleteEvidenceResult> {
  if (!UUID.test(evidenceId)) return { ok: false, error: "Unknown document." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Please log in to delete documents." };

  const { data: row, error: readError } = await supabase
    .from("evidence_submissions")
    .select("id, file_url, evidence_type")
    .eq("id", evidenceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) return { ok: false, error: `We couldn't find this document: ${readError.message}` };
  if (!row) return { ok: false, error: "This document no longer exists." };
  // Assessment results are stored in the same table but aren't documents the user uploaded.
  if (row.evidence_type === ASSESSMENT_EVIDENCE_TYPE) return { ok: false, error: "Assessment results can't be deleted." };

  // Users may not have delete rights on this table or bucket, so the server deletes with the service
  // role, always scoped to this user's own row and folder. Without the key it uses the user's session.
  const writer = createAdminClient() ?? supabase;

  const { data: deleted, error: deleteError } = await writer
    .from("evidence_submissions")
    .delete()
    .eq("id", evidenceId)
    .eq("user_id", user.id)
    .select("id");
  if (deleteError) return { ok: false, error: `We couldn't delete this document: ${deleteError.message}` };
  if (!deleted?.length) return { ok: false, error: "We couldn't delete this document. Please try again." };

  // The row is gone either way; a file left behind is logged rather than shown as a failed delete.
  const path = storagePath(row.file_url);
  if (path?.startsWith(`${user.id}/`)) {
    const { error: storageError } = await writer.storage.from(BUCKET_NAME).remove([path]);
    if (storageError) console.error(`Deleting '${path}' from '${BUCKET_NAME}' failed`, storageError);
  }

  revalidatePath("/evidence");
  revalidatePath("/assessment");
  revalidatePath("/dashboard");
  return { ok: true };
}
