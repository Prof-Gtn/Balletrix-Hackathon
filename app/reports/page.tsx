import { BarChart3, Calculator } from "lucide-react";
import { DCFCalculator } from "@/components/dcf-calculator";
import { DueDiligencePackage } from "@/components/due-diligence-package";
import { Card, PageTitle } from "@/components/page-title";
import { loadEntrepreneur } from "@/lib/entrepreneur";

export default async function ReportsPage() {
  await loadEntrepreneur();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageTitle title="Reports" subtitle="Professional documents for investors, written from your checked evidence and AI assessment." />

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <BarChart3 className="h-5 w-5 text-orange-500" /> Due Diligence Package
        </h2>
        <DueDiligencePackage />
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
