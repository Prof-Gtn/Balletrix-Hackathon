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
