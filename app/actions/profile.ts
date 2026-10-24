"use server";

import { isSector } from "@/lib/investors";
import { createClient } from "@/lib/supabase/server";

const MAX_NAME = 120;
const MAX_TARGET_MARKET = 300;
const MAX_DESCRIPTION = 5_000;

export type ProfileResult = { ok: true } | { ok: false; error: string };

// Saves the business profile (onboarding and the Business Profile page). target_market is optional so
// the profile page, which doesn't show it, leaves the saved value alone.
export async function saveBusinessProfile(formData: FormData): Promise<ProfileResult> {
  const businessName = String(formData.get("business_name") ?? "").trim();
  const sector = formData.get("sector");
  const description = String(formData.get("business_description") ?? "").trim();
  const targetMarketRaw = formData.get("target_market");

  if (!businessName) return { ok: false, error: "Please enter your business name." };
  if (businessName.length > MAX_NAME) return { ok: false, error: "Your business name is too long." };
  if (!isSector(sector)) return { ok: false, error: "Please choose your sector." };
  if (!description) return { ok: false, error: "Please describe your business in a few sentences." };
  if (description.length > MAX_DESCRIPTION) return { ok: false, error: "Please keep your description under 5,000 characters." };

  const fields: Record<string, string> = {
    business_name: businessName,
    sector,
    business_description: description,
  };
  if (targetMarketRaw !== null) {
    const targetMarket = String(targetMarketRaw).trim();
    if (!targetMarket) return { ok: false, error: "Please tell us who your customers are." };
    if (targetMarket.length > MAX_TARGET_MARKET) return { ok: false, error: "Please keep your target market short." };
    fields.target_market = targetMarket;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "You must be logged in to save your profile." };

  // Update first so an existing role and progress are never overwritten; insert only if there is no row yet.
  const { data: updated, error: updateError } = await supabase.from("profiles").update(fields).eq("id", user.id).select("id");
  if (updateError) return { ok: false, error: `We couldn't save your profile: ${updateError.message}` };

  if (!updated?.length) {
    const role = user.user_metadata?.role === "investor" ? "investor" : "entrepreneur";
    const { error: insertError } = await supabase.from("profiles").insert({ id: user.id, email: user.email, role, ...fields });
    if (insertError) return { ok: false, error: `We couldn't save your profile: ${insertError.message}` };
  }

  return { ok: true };
}
