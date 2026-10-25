import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import { BusinessProfileForm } from "@/components/business-profile-form";
import { HOME, toRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // "*" so this still loads before the business profile migration has run.
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  // Business onboarding is for entrepreneurs; investors and admins go to their own dashboards.
  const role = toRole(profile?.role);
  if (profile && role !== "entrepreneur") redirect(HOME[role]);
  const firstName = (user.user_metadata?.full_name || "").split(/\s+/)[0];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="w-full p-8 sm:p-10 md:w-1/2">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-500" strokeWidth={2.5} />
            <span className="text-xl font-bold text-slate-800">MulaStream AI</span>
          </Link>
          <p className="mb-2 text-xs font-bold tracking-[2px] text-orange-500 uppercase">Step 1 of 1 · Your business</p>
          <h1 className="mb-2 text-2xl font-bold">{firstName ? `Welcome, ${firstName}!` : "Welcome to MulaStream AI!"}</h1>
          <p className="mb-6 text-sm text-gray-500">Tell us a little about your business so your AI mentor can help you.</p>
          <BusinessProfileForm
            initial={{
              business_name: profile?.business_name ?? "",
              sector: profile?.sector ?? "",
              target_market: profile?.target_market ?? "",
              business_description: profile?.business_description ?? "",
            }}
            showTargetMarket
            submitLabel="Continue to Dashboard"
            redirectTo="/dashboard"
          />
        </div>
        <AuthPanel variant="signup" />
      </div>
    </div>
  );
}
