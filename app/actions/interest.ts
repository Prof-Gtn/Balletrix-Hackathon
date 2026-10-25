"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Postgres unique_violation: the investor already expressed interest in this entrepreneur.
const UNIQUE_VIOLATION = "23505";

export type InterestResult = { ok: true } | { ok: false; error: string };

// "Express Interest" on the investor dashboard. RLS also checks that the caller is an investor and the
// entrepreneur has reached Month 3.
export async function expressInterest(entrepreneurId: string): Promise<InterestResult> {
  if (!UUID.test(entrepreneurId)) return { ok: false, error: "Unknown startup." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Please log in as an investor." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "investor") return { ok: false, error: "Only investors can express interest." };

  const { error } = await supabase.from("investor_interests").insert({ investor_id: user.id, entrepreneur_id: entrepreneurId });
  if (error && error.code !== UNIQUE_VIOLATION) {
    console.error("expressInterest failed", error);
    return { ok: false, error: `We couldn't send your interest: ${error.message}` };
  }

  revalidatePath("/investor/dashboard");
  return { ok: true };
}
