import { NextResponse } from "next/server";
import { ASSESSMENT_EVIDENCE_TYPE, EVIDENCE_TYPE_LABELS, fileNameFromPath, isEvidenceType } from "@/lib/evidence";
import { generatePitchDeckOutline } from "@/lib/pitch-deck";
import { parseRedTeamReport } from "@/lib/red-team";
import { createClient } from "@/lib/supabase/server";

// POST, not GET: each call runs the AI model, so it shouldn't be triggered by prefetching or crawlers.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "You must be logged in to generate a pitch deck." }, { status: 401 });

  // "*" so this works before the newer profile columns' migrations have run.
  const [{ data: profile, error: profileError }, { data: rows, error: evidenceError }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("evidence_submissions")
      .select("evidence_type, file_url, ai_verification_status")
      .eq("user_id", user.id)
      .neq("evidence_type", ASSESSMENT_EVIDENCE_TYPE)
      .eq("ai_verification_status", "verified"),
  ]);
  if (profileError || evidenceError) {
    return NextResponse.json({ error: `Could not load your data: ${(profileError ?? evidenceError)?.message}` }, { status: 500 });
  }

  const roadmap: unknown[] = Array.isArray(profile?.roadmap) ? profile.roadmap : [];

  try {
    const markdown = await generatePitchDeckOutline({
      founderName: user.user_metadata?.full_name || user.email?.split("@")[0] || "Founder",
      businessName: profile?.business_name || null,
      sector: profile?.sector || null,
      targetMarket: profile?.target_market || null,
      description: profile?.business_description || null,
      readinessScore: profile?.readiness_score ?? 0,
      currentMonth: profile?.current_month ?? 1,
      verifiedDocuments: (rows ?? []).map(
        (row) =>
          `${isEvidenceType(row.evidence_type) ? EVIDENCE_TYPE_LABELS[row.evidence_type] : "Document"}: ${fileNameFromPath(row.file_url ?? "")}`
      ),
      actionPlan: roadmap
        .map((step) => (step && typeof step === "object" && "action" in step ? String((step as { action: unknown }).action) : ""))
        .filter(Boolean)
        .slice(0, 5),
      investorConcerns: (parseRedTeamReport(profile?.red_team_flaws)?.fatal_flaws ?? []).map((f) => f.title),
    });
    return NextResponse.json({ markdown });
  } catch (error) {
    console.error("generatePitchDeckOutline failed", error);
    return NextResponse.json({ error: "The pitch deck could not be generated. Please try again in a moment." }, { status: 502 });
  }
}
