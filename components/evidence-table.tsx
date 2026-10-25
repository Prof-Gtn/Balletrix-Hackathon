"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FileText, Loader2, Siren, Trash2 } from "lucide-react";
import { deleteEvidence } from "@/app/actions/evidence";
import { formatShortDate, isChecked, type EvidenceRow } from "@/components/evidence-list";
import { EVIDENCE_TYPE_LABELS, fileNameFromPath, toEvidenceType } from "@/lib/evidence";
import { cn } from "@/lib/utils";

// Evidence Centre: every uploaded document in one table. The AI's reasoning for a flagged document is
// folded away behind "View AI Reasoning", and each row can be deleted.
export function EvidenceTable({ evidence }: { evidence: EvidenceRow[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const rows = evidence.filter((item) => !removed.has(item.id));

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDelete(item: EvidenceRow) {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    setError(null);
    setDeletingId(item.id);
    startTransition(async () => {
      const result = await deleteEvidence(item.id);
      setDeletingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Hide it straight away, then refresh the counts and the rest of the page from the server.
      setRemoved((current) => new Set(current).add(item.id));
      router.refresh();
    });
  }

  if (!rows.length) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-500">
        No documents yet. Upload a signed contract, invoice or bank statement to get started.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="-mx-6 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-y border-gray-100 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
              <th scope="col" className="px-6 py-3">Document Name</th>
              <th scope="col" className="px-6 py-3">Type</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3 text-right">Date</th>
              <th scope="col" className="w-12 px-4 py-3">
                <span className="sr-only">Delete</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((item) => {
              const checked = isChecked(item);
              const fraudAlert = item.reconciliation_status === "failed";
              const type = toEvidenceType(item.evidence_type);
              const name = fileNameFromPath(item.file_url);
              // Only documents that need attention have reasoning worth reading.
              const hasReasoning = !checked && Boolean(item.ai_feedback);
              const isOpen = expanded.has(item.id);
              const isDeleting = deletingId === item.id;
              return (
                <Fragment key={item.id}>
                  <tr className={cn("align-middle hover:bg-gray-50/60", isDeleting && "opacity-50")}>
                    <td className="max-w-[300px] px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className={cn("h-4 w-4 shrink-0", checked ? "text-emerald-500" : "text-red-400")} />
                        <p className="truncate font-medium text-slate-800" title={name}>
                          {name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{type ? EVIDENCE_TYPE_LABELS[type] : "Document"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
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
                        {hasReasoning && (
                          <button
                            type="button"
                            onClick={() => toggle(item.id)}
                            aria-expanded={isOpen}
                            aria-controls={`reasoning-${item.id}`}
                            className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-slate-800"
                          >
                            View AI Reasoning
                            <ChevronDown className={cn("h-3.5 w-3.5 transition", isOpen && "rotate-180")} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap text-gray-500">{formatShortDate(item.created_at)}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={deletingId !== null}
                        aria-label={`Delete ${name}`}
                        title="Delete document"
                        className="grid h-8 w-8 place-items-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                  {hasReasoning && isOpen && (
                    <tr id={`reasoning-${item.id}`} className="bg-gray-50/60">
                      <td colSpan={5} className="px-6 pt-0 pb-4">
                        <p className="rounded-lg border border-red-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700">
                          <span className="font-semibold text-red-700">AI reasoning: </span>
                          {item.ai_feedback}
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
