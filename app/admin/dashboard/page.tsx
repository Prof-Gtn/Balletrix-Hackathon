import { CircleCheck, FileWarning, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { OverrideVerifyButton } from "@/components/override-verify-button";
import { PageTitle } from "@/components/page-title";
import { requireAdmin } from "@/lib/admin";
import { ASSESSMENT_EVIDENCE_TYPE, EVIDENCE_TYPE_LABELS, fileNameFromPath, toEvidenceType } from "@/lib/evidence";

type FlaggedRow = {
  id: string;
  user_id: string;
  evidence_type: string;
  file_url: string | null;
  month: number;
  ai_feedback: string | null;
  created_at: string;
};

// Admin Command Center: platform numbers and human review of documents the AI flagged.
export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin();

  // Uploaded documents only: failed assessments are also stored as "flagged" rows but aren't documents.
  const [entrepreneurs, investors, { data: flaggedData, error: flaggedError }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "entrepreneur"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "investor"),
    supabase
      .from("evidence_submissions")
      .select("id, user_id, evidence_type, file_url, month, ai_feedback, created_at")
      .eq("ai_verification_status", "flagged")
      .neq("evidence_type", ASSESSMENT_EVIDENCE_TYPE)
      .order("created_at", { ascending: false }),
  ]);
  const flagged = (flaggedData ?? []) as FlaggedRow[];

  // Entrepreneur names for the table, in one query.
  const userIds = [...new Set(flagged.map((row) => row.user_id))];
  const { data: owners } = userIds.length
    ? await supabase.from("profiles").select("id, business_name, email").in("id", userIds)
    : { data: [] };
  const ownerById = new Map((owners ?? []).map((o) => [o.id as string, o as { business_name: string | null; email: string | null }]));

  const loadError = entrepreneurs.error ?? investors.error ?? flaggedError;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageTitle title="Admin Command Center" subtitle="Platform overview and human review of documents the AI flagged." />

      {loadError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          We couldn&apos;t load all admin data: {loadError.message}. Make sure the admin migration has been run in Supabase.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard icon={Users} tone="bg-blue-100 text-blue-500" label="Total Entrepreneurs" value={entrepreneurs.count ?? 0} />
        <StatCard icon={TrendingUp} tone="bg-emerald-100 text-emerald-600" label="Total Investors" value={investors.count ?? 0} />
        <StatCard icon={FileWarning} tone="bg-red-100 text-red-500" label="Total Flagged Documents" value={flagged.length} />
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <ShieldAlert className="h-5 w-5 text-orange-500" /> Fraud Review
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Check each document yourself before overriding the AI. Every override is recorded in the audit log.
          </p>
        </div>

        {flagged.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Entrepreneur</th>
                  <th className="px-6 py-3">File</th>
                  <th className="px-6 py-3">AI Reasoning</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {flagged.map((row) => {
                  const owner = ownerById.get(row.user_id);
                  const type = toEvidenceType(row.evidence_type);
                  return (
                    <tr key={row.id} className="align-top">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{owner?.business_name || "Unnamed business"}</p>
                        {owner?.email && <p className="text-xs text-gray-400">{owner.email}</p>}
                      </td>
                      <td className="px-6 py-4">
                        {row.file_url ? (
                          <a
                            href={row.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium break-all text-blue-600 hover:underline"
                          >
                            {fileNameFromPath(row.file_url)}
                          </a>
                        ) : (
                          <span className="text-gray-400">No file</span>
                        )}
                        <p className="mt-0.5 text-xs text-gray-400">
                          {type ? EVIDENCE_TYPE_LABELS[type] : "Document"} · Month {row.month}
                        </p>
                      </td>
                      <td className="max-w-sm px-6 py-4 text-gray-600">{row.ai_feedback || "No reasoning recorded."}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <OverrideVerifyButton evidenceId={row.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <CircleCheck className="mx-auto mb-3 h-8 w-8 text-emerald-400" />
            <p className="font-medium text-slate-700">No flagged documents</p>
            <p className="mt-1 text-sm text-gray-500">Everything the AI flagged has been reviewed.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <span className={`grid h-12 w-12 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-slate-800">{value.toLocaleString("en")}</p>
      </div>
    </div>
  );
}
