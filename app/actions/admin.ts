"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type OverrideResult = { ok: true } | { ok: false; error: string };

// Human-in-the-loop override: an admin marks a document the AI flagged as verified. The database
// function checks the admin role, updates the status and writes admin_audit_logs in one transaction.
export async function overrideAndVerify(evidenceId: string): Promise<OverrideResult> {
  if (!UUID.test(evidenceId)) return { ok: false, error: "Unknown document." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Please log in." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { ok: false, error: "Only admins can verify documents." };

  const { data: updated, error } = await supabase.rpc("admin_verify_evidence", { p_evidence: evidenceId });
  if (error) {
    console.error("admin_verify_evidence failed", error);
    return { ok: false, error: `We couldn't verify this document: ${error.message}` };
  }
  if (!updated) return { ok: false, error: "This document is no longer flagged." };

  revalidatePath("/admin/dashboard");
  return { ok: true };
}
