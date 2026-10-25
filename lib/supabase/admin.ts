import "server-only";

import { createClient } from "@supabase/supabase-js";

// Service-role client for the few writes users must not make themselves (readiness_score and
// current_month, protected by a database trigger). Bypasses RLS, so only use it after checking the
// user server-side and always scope writes to that user's id. Null when the key isn't configured.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
