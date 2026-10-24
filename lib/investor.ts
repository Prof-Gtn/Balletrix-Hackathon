import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ReadyStartup = {
  id: string;
  business_name: string | null;
  sector: string | null;
  readiness_score: number | null;
  current_month: number | null;
};

// Investor pages are only for profiles with role = 'investor'; everyone else goes to their dashboard.
export async function requireInvestor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "investor") redirect("/dashboard");

  return { supabase, user };
}

// Startups that reached Month 3, via a database function that only returns rows to investors.
export async function loadReadyStartups(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase.rpc("investment_ready_startups");
  return { startups: (data ?? []) as ReadyStartup[], error: error?.message ?? null };
}
