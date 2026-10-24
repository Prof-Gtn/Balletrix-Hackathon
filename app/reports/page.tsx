import Link from "next/link";
import { BarChart3, Calculator, CheckCircle2, Presentation, XCircle } from "lucide-react";
import { DCFCalculator } from "@/components/dcf-calculator";
import { DueDiligencePackage, PitchDeckOutline } from "@/components/due-diligence-package";
import { isChecked } from "@/components/evidence-list";
import { Card, PageTitle } from "@/components/page-title";
import { loadEntrepreneur } from "@/lib/entrepreneur";
import type { EvidenceType } from "@/lib/evidence";

// What investors expect to see in a due diligence pack, matched to the Evidence Centre's document types.
const CHECKLIST: { label: string; type: EvidenceType; hint: string }[] = [
  { label: "Business Registration (BIPA)", type: "business_registration", hint: "Your BIPA registration certificate" },
  { label: "Tax Good Standing (NamRA)", type: "tax_good_standing", hint: "A NamRA certificate of good standing" },
  { label: "Signed Contracts", type: "signed_contract", hint: "At least one signed customer or supplier contract" },
  { label: "Bank Statements", type: "bank_statement", hint: "A recent business bank statement (PDF from your bank)" },
];

export default async function ReportsPage() {
  const { uploads } = await loadEntrepreneur();
  const verifiedTypes = new Set(uploads.filter(isChecked).map((row) => row.evidence_type));
  const done = CHECKLIST.filter((item) => verifiedTypes.has(item.type)).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageTitle title="Reports" subtitle="Professional documents for investors, written from your checked evidence and AI assessment." />

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <BarChart3 className="h-5 w-5 text-orange-500" /> Due Diligence Package
        </h2>
        <DueDiligencePackage />

        <div className="mt-6 border-t border-gray-100 pt-6">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-bold text-slate-800">Due Diligence Checklist</h3>
            <p className="text-sm text-gray-500">
              {done} of {CHECKLIST.length} documents verified
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {CHECKLIST.map((item) => {
              const verified = verifiedTypes.has(item.type);
              return (
                <li
                  key={item.type}
                  className={`flex items-start gap-3 rounded-lg border p-4 ${verified ? "border-emerald-100 bg-emerald-50/50" : "border-gray-100"}`}
                >
                  {verified ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-label="Verified" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-red-500" aria-label="Missing" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    <p className="text-xs text-gray-500">{verified ? "Verified" : item.hint}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          {done < CHECKLIST.length && (
            <Link href="/evidence" className="mt-4 inline-block text-sm font-medium text-orange-600 hover:underline">
              Upload missing documents in the Evidence Centre →
            </Link>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Presentation className="h-5 w-5 text-orange-500" /> Pitch Deck Outline
        </h2>
        <PitchDeckOutline />
      </Card>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Calculator className="h-5 w-5 text-orange-500" /> What is my business worth?
        </h2>
        <DCFCalculator />
      </Card>
    </div>
  );
}
