import "server-only";

import { cookies } from "next/headers";
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGE_COOKIE, type Language } from "@/lib/languages";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// The language the AI should write in: the signed-in user's profile setting, then the visitor cookie,
// then English. select("*") so this still works before the preferred_language migration has run.
export async function loadPreferredLanguage(supabase: Supabase, userId: string | null): Promise<Language> {
  if (userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (isLanguage(data?.preferred_language)) return data.preferred_language;
  }
  const cookie = (await cookies()).get(LANGUAGE_COOKIE)?.value;
  return isLanguage(cookie) ? cookie : DEFAULT_LANGUAGE;
}
