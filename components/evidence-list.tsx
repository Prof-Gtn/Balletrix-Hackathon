import { FileText, Siren } from "lucide-react";
import { EVIDENCE_TYPE_LABELS, fileNameFromPath, toEvidenceType } from "@/lib/evidence";
import { cn } from "@/lib/utils";

const TIME_ZONE = "Africa/Windhoek";

export type EvidenceRow = {
  id: string;
  file_url: string;
  evidence_type: string;
  month: number;
  ai_verification_status: string;
  ai_feedback: string | null;
  reconciliation_status?: string | null;
  created_at: string;
};

export function isChecked(row: Pick<EvidenceRow, "ai_verification_status">): boolean {
  return row.ai_verification_status === "verified";
}

// "Checked Documents" / "Needs Attention" counts for the current month (the month that earns the bonus).
export function countEvidence(evidence: EvidenceRow[], month: number) {
  const thisMonth = evidence.filter((item) => item.month === month);
  const checkedCount = thisMonth.filter(isChecked).length;
  return { checkedCount, needsAttentionCount: thisMonth.length - checkedCount };
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", timeZone: TIME_ZONE }).format(new Date(value));
}

export function CountChip({
  label,
  count,
  icon: Icon,
  tone,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "good" | "bad";
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl px-4 py-3.5", tone === "good" ? "bg-emerald-50" : "bg-red-50")}>
      <Icon className={cn("h-5 w-5 shrink-0", tone === "good" ? "text-emerald-600" : "text-red-500")} />
      <div className="min-w-0">
        <p className="text-2xl leading-none font-bold text-slate-800">{count}</p>
        <p className="mt-1 truncate text-xs font-medium text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// Evidence Centre: every uploaded document in one table, with colour-coded status badges.
export function EvidenceTable({ evidence }: { evidence: EvidenceRow[] }) {
  if (!evidence.length) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-500">
        No documents yet. Upload a signed contract, invoice or bank statement to get started.
      </p>
    );
  }

  return (
    <div className="-mx-6 overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-y border-gray-100 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
            <th scope="col" className="px-6 py-3">Document Name</th>
            <th scope="col" className="px-6 py-3">Type</th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3 text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {evidence.map((item) => {
            const checked = isChecked(item);
            const fraudAlert = item.reconciliation_status === "failed";
            const type = toEvidenceType(item.evidence_type);
            return (
              <tr key={item.id} className="align-top hover:bg-gray-50/60">
                <td className="max-w-[320px] px-6 py-4">
                  <div className="flex items-start gap-3">
                    <FileText className={cn("mt-0.5 h-4 w-4 shrink-0", checked ? "text-emerald-500" : "text-red-400")} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{fileNameFromPath(item.file_url)}</p>
                      {fraudAlert && item.ai_feedback && <p className="mt-1 text-xs leading-relaxed text-red-600">{item.ai_feedback}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{type ? EVIDENCE_TYPE_LABELS[type] : "Document"}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        checked ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      )}
                    >
                      {checked ? "Verified" : "Flagged"}
                    </span>
                    {fraudAlert && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#ff1f3d] px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white uppercase">
                        <Siren className="h-3 w-3" /> Fraud Alert
                      </span>
                    )}
                    {item.reconciliation_status === "reconciled" && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Reconciled
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap text-gray-500">{formatShortDate(item.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Uploaded documents with their check status, Fraud Alert badge and the reason a bank statement failed.
export function EvidenceList({
  evidence,
  title = "Your uploaded documents",
  empty = "No documents uploaded yet.",
}: {
  evidence: EvidenceRow[];
  title?: string;
  empty?: string;
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-bold text-slate-800">{title}</h4>
      {!evidence.length ? (
        <p className="py-2 text-sm text-gray-500">{empty}</p>
      ) : (
        <ul>
          {evidence.map((item) => {
            const checked = isChecked(item);
            const fraudAlert = item.reconciliation_status === "failed";
            const type = toEvidenceType(item.evidence_type);
            return (
              <li key={item.id} className="border-b border-gray-100 py-4 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-lg",
                      checked ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                    )}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex min-w-0 flex-wrap items-center gap-1.5">
                      <b className="truncate text-sm font-medium text-slate-800">{fileNameFromPath(item.file_url)}</b>
                      {fraudAlert && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ff1f3d] px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white uppercase shadow-[0_0_0_3px_#ff1f3d26]">
                          <Siren className="h-3 w-3" /> Fraud Alert
                        </span>
                      )}
                    </div>
                    <small className="text-xs text-gray-400">
                      {type ? EVIDENCE_TYPE_LABELS[type] : "Document"} · Month {item.month} · {formatShortDate(item.created_at)}
                      {item.reconciliation_status === "reconciled" && <span className="text-emerald-600"> · Reconciled</span>}
                    </small>
                  </div>
                  <b className={cn("shrink-0 text-sm", checked ? "text-emerald-600" : "text-red-500")}>
                    {checked ? "Checked" : "Needs attention"}
                  </b>
                </div>
                {fraudAlert && item.ai_feedback && (
                  <p className="mt-2.5 rounded-lg border border-[#ff1f3d]/30 bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-700 sm:ml-14">
                    {item.ai_feedback}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
