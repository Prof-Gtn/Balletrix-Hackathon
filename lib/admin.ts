import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Admin pages are only for profiles with role = 'admin'; everyone else goes to their dashboard.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");

  return { supabase, user };
}
