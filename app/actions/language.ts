"use server";

import { cookies } from "next/headers";
import { isLanguage, LANGUAGE_COOKIE } from "@/lib/languages";
import { createClient } from "@/lib/supabase/server";

const ONE_YEAR = 60 * 60 * 24 * 365;

export type LanguageResult = { ok: true } | { ok: false; error: string };

// Saves the language for AI output: in a cookie (so visitors on the landing page can choose too) and,
// when signed in, in profiles.preferred_language.
export async function setPreferredLanguage(language: string): Promise<LanguageResult> {
  if (!isLanguage(language)) return { ok: false, error: "Please choose English, Afrikaans or Oshiwambo." };

  (await cookies()).set(LANGUAGE_COOKIE, language, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: true };

  const { error } = await supabase.from("profiles").update({ preferred_language: language }).eq("id", user.id);
  if (error) {
    console.error("Saving preferred_language failed", error);
    return { ok: false, error: `We couldn't save your language: ${error.message}` };
  }
  return { ok: true };
}
