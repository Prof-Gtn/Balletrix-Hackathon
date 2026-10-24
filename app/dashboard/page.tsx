import { redirect } from "next/navigation";
import { CheckCircle2, FileText, ShieldAlert } from "lucide-react";
import { AssessmentForm } from "@/components/assessment-form";
import { EvidenceUploadForm } from "@/components/evidence-upload-form";
import { EVIDENCE_TYPE_LABELS, isEvidenceType } from "@/lib/evidence";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("current_month, readiness_score, business_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: evidence, error: evidenceError } = await supabase
    .from("evidence_submissions")
    .select("id, file_url, evidence_type, ai_verification_status, created_at")
    .eq("user_id", user.id)
    .not("file_url", "is", null)
    .order("created_at", { ascending: false });

  const currentMonth: number = profile?.current_month ?? 1;
  const readinessScore: number = profile?.readiness_score ?? 0;
  const businessName: string = profile?.business_name || user.email || "Your business";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">MulaStream</p>
          <h1 className="truncate text-2xl font-bold tracking-tight">{businessName}</h1>
        </div>
        <SignOutButton />
      </header>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load your profile: {error.message}
        </p>
      )}

      <section className="grid gap-6 rounded-xl bg-zinc-900 p-6 text-white sm:grid-cols-2 sm:p-8">
        <div>
          <p className="text-sm text-zinc-400">Current Level</p>
          <p className="mt-1 text-4xl font-bold">Month {currentMonth}</p>
          <div className="mt-4 flex gap-2" aria-label={`Month ${currentMonth} of 3`}>
            {[1, 2, 3].map((m) => (
              <span key={m} className={`h-2 flex-1 rounded-full ${m <= currentMonth ? "bg-emerald-400" : "bg-zinc-700"}`} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm text-zinc-400">Readiness Score</p>
          <p className="mt-1 text-4xl font-bold">
            {readinessScore}
            <span className="text-xl font-medium text-zinc-400">/100</span>
          </p>
          <div className="mt-4 h-2 rounded-full bg-zinc-700">
            <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${Math.min(100, Math.max(0, readinessScore))}%` }} />
          </div>
        </div>
      </section>

      <AssessmentForm currentMonth={currentMonth} />

      <section className="flex flex-col gap-4">
        <EvidenceUploadForm />

        <div className="rounded-xl border p-6">
          <h2 className="font-semibold">Submitted Evidence</h2>
          {evidenceError ? (
            <p className="mt-3 text-sm text-red-700">Could not load your evidence: {evidenceError.message}</p>
          ) : !evidence?.length ? (
            <p className="mt-3 text-sm text-zinc-500">No evidence uploaded yet.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {evidence.map((item) => {
                const verified = item.ai_verification_status === "verified";
                return (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="min-w-0">
                        <span className="block truncate">{fileNameFromPath(item.file_url)}</span>
                        {isEvidenceType(item.evidence_type) && (
                          <span className="block text-xs text-zinc-500">{EVIDENCE_TYPE_LABELS[item.evidence_type]}</span>
                        )}
                      </span>
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {verified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                      {verified ? "Verified" : "Flagged"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

// Paths look like <user id>/<timestamp>-<file name>.
function fileNameFromPath(path: string): string {
  const last = path.split("/").pop() ?? path;
  return last.replace(/^\d+-/, "");
}
