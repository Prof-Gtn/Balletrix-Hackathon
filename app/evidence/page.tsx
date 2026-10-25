import { Download, FileCheck2, FileText, FileWarning, Sparkles } from "lucide-react";
import { isChecked } from "@/components/evidence-list";
import { EvidenceTable } from "@/components/evidence-table";
import { EvidenceUploadForm } from "@/components/evidence-upload-form";
import { GLOSSARY, InfoTip } from "@/components/info-tip";
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
        {uploads.length ? (
          <Card className="lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-1.5 text-lg font-bold text-slate-800">
              Your Documents <InfoTip text={GLOSSARY.evidence} label="Evidence Centre" />
            </h2>
            <EvidenceTable evidence={uploads} />
          </Card>
        ) : (
          <EmptyEvidence />
        )}
      </div>
    </div>
  );
}

// First visit: a friendly explanation instead of an empty table.
function EmptyEvidence() {
  return (
    <section className="flex flex-col justify-center rounded-xl border border-gray-100 bg-white p-8 shadow-sm lg:col-span-2">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-orange-100 text-orange-600">
        <Sparkles className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-xl font-bold text-slate-800">Welcome to your Evidence Centre</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-gray-600">
        You haven&apos;t uploaded any proof yet. To pass Month 1, we need to see that people are buying from you. Upload a signed
        contract or a bank statement here.
      </p>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500">
        Not sure what a bank statement should look like? Download our sample to see the format, then upload your own statement from
        your bank. The sample itself won&apos;t be accepted as proof.
      </p>
      <a
        href="/samples/sample-bank-statement.pdf"
        download
        className="mt-6 inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <Download className="h-4 w-4 text-orange-500" /> Download Sample Bank Statement
      </a>
    </section>
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
