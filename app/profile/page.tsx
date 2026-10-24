import { BusinessProfileForm } from "@/components/business-profile-form";
import { Card, PageTitle } from "@/components/page-title";
import { loadEntrepreneur } from "@/lib/entrepreneur";

export default async function BusinessProfilePage() {
  const { profile, error } = await loadEntrepreneur();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <PageTitle title="Business Profile" subtitle="Keep your business details up to date. Your AI mentor and investor reports use them." />

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">We couldn&apos;t load your profile: {error}</p>}

      <Card>
        <BusinessProfileForm
          initial={{
            business_name: profile?.business_name ?? "",
            sector: profile?.sector ?? "",
            business_description: profile?.business_description ?? "",
          }}
          showTargetMarket={false}
          submitLabel="Save Profile"
        />
      </Card>
    </div>
  );
}
