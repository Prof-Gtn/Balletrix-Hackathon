"use server";

import { isInstrument, isSector } from "@/lib/investors";
import { createClient } from "@/lib/supabase/server";

const MAX_AMOUNT = 1_000_000_000;

export type PreferencesResult = { ok: true; message: string } | { ok: false; error: string };

export async function saveInvestorPreferences(formData: FormData): Promise<PreferencesResult> {
  const sector = formData.get("preferred_sector");
  const instrument = formData.get("preferred_instrument");
  const amount = Number(formData.get("max_investment_amount"));

  if (!isSector(sector)) return { ok: false, error: "Please choose a sector." };
  if (!isInstrument(instrument)) return { ok: false, error: "Please choose debt or equity." };
  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT) {
    return { ok: false, error: "Enter a maximum investment between N$ 0 and N$ 1,000,000,000." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "You must be logged in to save preferences." };

  const { error } = await supabase.from("investor_preferences").upsert(
    {
      user_id: user.id,
      preferred_sector: sector,
      max_investment_amount: amount,
      preferred_instrument: instrument,
    },
    { onConflict: "user_id" }
  );
  if (error) return { ok: false, error: `Could not save your preferences: ${error.message}` };

  return { ok: true, message: "Preferences saved. You'll be matched with entrepreneurs in this sector." };
}
