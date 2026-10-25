import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { isLanguage } from "@/lib/languages";
import { loadPreferredLanguage } from "@/lib/preferred-language";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MulaStream AI",
  description: "AI mentorship, business assessment and investment readiness for Namibian entrepreneurs",
};

export const viewport: Viewport = {
  themeColor: "#1a202c",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The app shell (sidebar + header) shows the signed-in user's name; public pages render without it.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const name: string = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Founder";
  // select("*") so the shell still renders before newer columns' migrations have run.
  const { data: profile } = user ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle() : { data: null };
  const language = isLanguage(profile?.preferred_language) ? profile.preferred_language : await loadPreferredLanguage(supabase, null);

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans text-slate-800 antialiased">
        <AppShell
          name={name}
          email={user?.email ?? ""}
          isLoggedIn={Boolean(user)}
          isAdmin={profile?.role === "admin"}
          language={language}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
