import { ShieldAlert, ShieldCheck } from "lucide-react";
import { CountChip, countEvidence, EvidenceList, isChecked } from "@/components/evidence-list";
import { EvidenceUploadForm } from "@/components/evidence-upload-form";
import { Card, PageTitle } from "@/components/page-title";
import { loadEntrepreneur } from "@/lib/entrepreneur";

export default async function EvidenceCentrePage() {
  const { uploads, currentMonth, error } = await loadEntrepreneur();
  const { checkedCount, needsAttentionCount } = countEvidence(uploads, currentMonth);
  const checked = uploads.filter(isChecked);
  const needsAttention = uploads.filter((row) => !isChecked(row));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageTitle
        title="Evidence Centre"
        subtitle="Upload documents that prove your business is real. Bank statements are checked automatically by our AI accountant."
      />

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">We couldn&apos;t load your documents: {error}</p>}

      <div className="grid grid-cols-2 gap-4 md:max-w-md">
        <CountChip label={`Checked Documents · Month ${currentMonth}`} count={checkedCount} icon={ShieldCheck} tone="good" />
        <CountChip label={`Needs Attention · Month ${currentMonth}`} count={needsAttentionCount} icon={ShieldAlert} tone="bad" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <EvidenceUploadForm />
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <EvidenceList evidence={checked} title="Checked Documents" empty="No checked documents yet. Upload a signed contract, invoice or bank statement." />
          </Card>
          <Card>
            <EvidenceList evidence={needsAttention} title="Needs Attention" empty="Nothing needs your attention." />
          </Card>
        </div>
      </div>
    </div>
  );
}
