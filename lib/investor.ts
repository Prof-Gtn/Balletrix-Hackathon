import "server-only";

import { redirect } from "next/navigation";
import { HOME, toRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export type ReadyStartup = {
  id: string;
  business_name: string | null;
  sector: string | null;
  target_market: string | null;
  business_description: string | null;
  readiness_score: number | null;
  current_month: number | null;
};

// Investor pages are only for profiles with role = 'investor'; everyone else goes to their own dashboard.
export async function requireInvestor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = toRole(profile?.role);
  if (role !== "investor") redirect(HOME[role]);

  return { supabase, user };
}

// "TypeError: fetch failed" and similar: the server couldn't reach Supabase at all (network, DNS, or the
// project waking up), as opposed to an error returned by the database.
function isNetworkError(message: string | undefined): boolean {
  return Boolean(message && /fetch failed|network|ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(message));
}

const NETWORK_ERROR = "We couldn't reach the database just now. Check your internet connection and refresh the page.";

// Startups that reached Month 3, via a database function that only returns rows to investors.
// It has to be a function: profiles are private under RLS, so a direct query from an investor's session
// would return no other users' rows. A dropped connection is retried once before showing an error.
export async function loadReadyStartups(supabase: Awaited<ReturnType<typeof createClient>>) {
  let result = await supabase.rpc("get_investment_ready_startups");
  if (isNetworkError(result.error?.message)) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    result = await supabase.rpc("get_investment_ready_startups");
  }
  const { data, error } = result;
  if (error) console.error("get_investment_ready_startups failed", error);
  return {
    startups: (data ?? []) as ReadyStartup[],
    error: error ? (isNetworkError(error.message) ? NETWORK_ERROR : error.message) : null,
  };
}
