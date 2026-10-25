import Link from "next/link";
import { Bot, ClipboardCheck, Sprout } from "lucide-react";
import { Brand } from "@/components/brand";
import { LanguageSelector } from "@/components/LanguageSelector";
import { loadPreferredLanguage } from "@/lib/preferred-language";
import { createClient } from "@/lib/supabase/server";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80";

const FEATURES = [
  { icon: Bot, title: "AI-Powered Mentorship", text: "Get personalised advice from our AI business mentor." },
  { icon: ClipboardCheck, title: "Business Assessment", text: "Get a clear score and actionable recommendations." },
  { icon: Sprout, title: "Investment Ready", text: "Access funding opportunities and investor support." },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const language = await loadPreferredLanguage(supabase, user?.id ?? null);

  return (
    <div className="min-h-screen bg-white">
      <nav className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-navy px-5 py-5 text-white md:px-8">
        <Brand />
        <div className="hidden space-x-8 text-sm font-medium text-gray-300 md:flex">
          <a href="#home" className="hover:text-white">Home</a>
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#about" className="hover:text-white">About</a>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
          <LanguageSelector initial={language} tone="dark" />
          {user ? (
            <Link href="/dashboard" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-white hover:text-orange-400">
                Login
              </Link>
              <Link href="/signup" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero: business woman photo under a navy gradient that fades out to the right. */}
      <section id="home" className="relative flex min-h-[600px] items-center overflow-hidden bg-navy-2 text-white">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover object-center opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-2 via-navy-2/90 to-transparent" />
        </div>
        <div className="relative z-10 px-5 py-20 md:w-3/5 md:px-8 md:py-32">
          <h1 className="mb-6 text-4xl leading-tight font-bold md:text-6xl">
            Turn Your Business
            <br />
            Idea Into <span className="text-orange-500">Real Growth</span>
          </h1>
          <p className="mb-8 max-w-lg text-lg leading-relaxed text-gray-300">
            MulaStream AI connects entrepreneurs with AI mentorship, expert guidance and investment opportunities to help you
            build, grow and scale.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="rounded-md bg-emerald-500 px-8 py-3 font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="rounded-md border border-gray-400 px-8 py-3 font-medium text-white backdrop-blur-sm transition hover:border-white hover:bg-white/10"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-20 grid grid-cols-1 gap-8 bg-white p-8 md:grid-cols-3 md:p-12">
        {FEATURES.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className={i === 1 ? "p-4 text-center md:border-x md:border-gray-100" : "p-4 text-center"}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
              <Icon className="h-7 w-7 text-orange-500" />
            </div>
            <h3 className="mb-2 text-lg font-bold">{title}</h3>
            <p className="text-sm text-gray-500">{text}</p>
          </div>
        ))}
      </section>

      <section id="about" className="border-t border-gray-100 bg-gray-50 px-5 py-12 text-center md:px-8">
        <h2 className="text-2xl font-bold text-slate-800">Built for Namibian entrepreneurs</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-500">
          MulaStream AI guides you through a three-month incubation programme: an honest AI assessment of your business,
          proof from real documents, and a professional package for investors when you are ready.
        </p>
        <p className="mt-8 text-xs text-gray-400">© {new Date().getFullYear()} MulaStream AI · Empowering Entrepreneurs. Connecting Investors.</p>
      </section>
    </div>
  );
}
