import "server-only";

import { redirect } from "next/navigation";
import type { EvidenceRow } from "@/components/evidence-list";
import { ASSESSMENT_EVIDENCE_TYPE } from "@/lib/evidence";
import type { Progress } from "@/lib/gamification";
import { HOME, toRole, type Role } from "@/lib/roles";
import { toIncubationMonth, type IncubationMonth } from "@/lib/gates";
import { createClient } from "@/lib/supabase/server";

export type EntrepreneurData = {
  userId: string;
  name: string;
  firstName: string;
  email: string;
  // Untyped row: select("*") so pages load before the newer columns' migrations have run.
  profile: Record<string, any> | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  currentMonth: IncubationMonth;
  readinessScore: number;
  uploads: EvidenceRow[]; // newest first
  assessments: EvidenceRow[]; // newest first
  progress: Progress;
  error: string | null;
};

// Loads everything the entrepreneur pages share. Sends signed-out visitors to /login, investors and
// admins to their own dashboards, and entrepreneurs who haven't finished onboarding to /onboarding.
export async function loadEntrepreneur({ requireOnboarding = false } = {}): Promise<EntrepreneurData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile, error: profileError }, { data: rows, error: evidenceError }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("evidence_submissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const role = toRole(profile?.role);
  if (role !== "entrepreneur") redirect(HOME[role]);
  if (requireOnboarding && !profileError && !profile?.business_name) redirect("/onboarding");

  const evidence = (rows ?? []) as EvidenceRow[];
  const uploads = evidence.filter((row) => row.evidence_type !== ASSESSMENT_EVIDENCE_TYPE && row.file_url);
  const assessments = evidence.filter((row) => row.evidence_type === ASSESSMENT_EVIDENCE_TYPE);

  const currentMonth = toIncubationMonth(profile?.current_month ?? 1);
  const readinessScore: number = profile?.readiness_score ?? 0;
  const email = user.email ?? "";
  const name: string = user.user_metadata?.full_name || email.split("@")[0] || "Founder";

  return {
    userId: user.id,
    name,
    firstName: name.split(/\s+/)[0],
    email,
    profile,
    currentMonth,
    readinessScore,
    uploads,
    assessments,
    progress: {
      hasBusinessName: Boolean(profile?.business_name),
      readinessScore,
      currentMonth,
      checkedDocuments: uploads.filter((row) => row.ai_verification_status === "verified").length,
      uploadedDocuments: uploads.length,
      assessments: assessments.length,
      profileComplete: Boolean(profile?.business_name && profile?.sector && profile?.business_description),
    },
    error: (profileError ?? evidenceError)?.message ?? null,
  };
}

export type MemberData = { userId: string; email: string; name: string; firstName: string; role: Role };

// For pages every signed-in role can use (AI Mentor, Help & Support, Settings).
export async function loadMember(): Promise<MemberData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const email = user.email ?? "";
  const name: string = user.user_metadata?.full_name || email.split("@")[0] || "Founder";
  return { userId: user.id, email, name, firstName: name.split(/\s+/)[0], role: toRole(profile?.role) };
}
