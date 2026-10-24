import { redirect } from "next/navigation";
import { FileCheck2, Sparkles, TrendingUp } from "lucide-react";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

const BENEFITS = [
  { icon: Sparkles, title: "AI investment audit", text: "A strict auditor scores your business and challenges your model." },
  { icon: FileCheck2, title: "Evidence that counts", text: "Upload contracts and invoices to prove real traction." },
  { icon: TrendingUp, title: "Three gates to investment", text: "Unlock each incubation month as your readiness grows." },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="grid min-h-screen bg-white md:grid-cols-[minmax(320px,0.88fr)_1.12fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-navy-2 p-[clamp(28px,5vw,68px)] text-white md:flex">
        {/* Decorative rings in the bottom-right corner. */}
        <div
          aria-hidden
          className="absolute -right-[180px] -bottom-[150px] h-[360px] w-[360px] rounded-full border border-white/[0.07] shadow-[0_0_0_35px_#ffffff05,0_0_0_75px_#ffffff04]"
        />
        <Brand className="relative z-10" />
        <div className="relative z-10 my-auto max-w-[430px]">
          <h1 className="mb-[18px] text-[clamp(34px,4vw,54px)] leading-[1.08] font-bold tracking-[-2px]">
            Your business.
            <br />
            <span className="text-brand-light">Your momentum.</span>
          </h1>
          <p className="max-w-[400px] text-[15px] leading-[1.75] text-[#c3ccdc]">
            Find out how investment-ready your business really is. Get challenged, prove your traction and keep moving
            toward funding.
          </p>
          <div className="mt-[38px] grid gap-[19px]">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-[13px]">
                <div className="grid h-[39px] w-[39px] shrink-0 place-items-center rounded-[13px] bg-white/[0.07] text-[#c5baff]">
                  <Icon className="h-[17px] w-[17px]" />
                </div>
                <div>
                  <b className="mb-[3px] block text-[13px]">{title}</b>
                  <small className="text-xs text-[#b4bfd2]">{text}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-[#98a7bd]">© {new Date().getFullYear()} MulaStream · Manage. Send. Grow.</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fc] px-4 py-6 sm:px-6 sm:py-9">
        <LoginForm />
      </main>
    </div>
  );
}
