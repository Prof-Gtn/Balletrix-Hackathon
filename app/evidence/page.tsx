import { FileCheck2, FileText, FileWarning } from "lucide-react";
import { EvidenceTable, isChecked } from "@/components/evidence-list";
import { EvidenceUploadForm } from "@/components/evidence-upload-form";
import { Card, PageTitle } from "@/components/page-title";
import { loadEntrepreneur } from "@/lib/entrepreneur";

export default async function EvidenceCentrePage() {
  const { uploads, error } = await loadEntrepreneur();
  const verified = uploads.filter(isChecked).length;
  const flagged = uploads.length - verified;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageTitle
        title="Evidence Centre"
        subtitle="Upload documents that prove your business is real. Bank statements are checked automatically by our AI accountant."
      />

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">We couldn&apos;t load your documents: {error}</p>}

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
        <SummaryItem icon={FileText} label="Total Documents" value={uploads.length} tone="text-slate-700" />
        <span className="hidden h-6 w-px bg-gray-200 sm:block" aria-hidden />
        <SummaryItem icon={FileCheck2} label="Verified" value={verified} tone="text-emerald-600" />
        <span className="hidden h-6 w-px bg-gray-200 sm:block" aria-hidden />
        <SummaryItem icon={FileWarning} label="Flagged" value={flagged} tone="text-red-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <EvidenceUploadForm />
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-slate-800">Your Documents</h2>
          <EvidenceTable evidence={uploads} />
        </Card>
      </div>
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <p className="flex items-center gap-2 text-sm text-gray-500">
      <Icon className={`h-4 w-4 ${tone}`} />
      {label}: <span className={`text-base font-bold ${tone}`}>{value}</span>
    </p>
  );
}
