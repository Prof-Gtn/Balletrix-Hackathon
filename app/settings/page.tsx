import Link from "next/link";
import { ArrowRight, Globe, UserRound } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Card, PageTitle } from "@/components/page-title";
import { loadMember } from "@/lib/entrepreneur";
import { loadPreferredLanguage } from "@/lib/preferred-language";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/utils";

const ROLE_LABELS = { entrepreneur: "Entrepreneur", investor: "Investor", admin: "Administrator" } as const;

// Account settings for every role. Entrepreneurs also manage their business on the Business Profile page.
export default async function SettingsPage() {
  const member = await loadMember();
  const language = await loadPreferredLanguage(await createClient(), member.userId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <PageTitle title="Settings" subtitle="Your account and how MulaStream AI talks to you." />

      <Card>
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
          <UserRound className="h-5 w-5 text-orange-500" /> Account
        </h2>
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-orange-500 text-lg font-bold text-white">
            {initials(member.name)}
          </span>
          <dl className="min-w-0 space-y-1 text-sm">
            <div>
              <dt className="sr-only">Name</dt>
              <dd className="truncate text-base font-semibold text-slate-800">{member.name}</dd>
            </div>
            <div>
              <dt className="sr-only">Email</dt>
              <dd className="truncate text-gray-500">{member.email}</dd>
            </div>
            <div>
              <dt className="sr-only">Account type</dt>
              <dd>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{ROLE_LABELS[member.role]}</span>
              </dd>
            </div>
          </dl>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Globe className="h-5 w-5 text-orange-500" /> AI Language
        </h2>
        <p className="mb-4 text-sm text-gray-500">The AI Mentor, assessments, Tough Love and memos are written in this language.</p>
        <div className="inline-block">
          <LanguageSelector initial={language} />
        </div>
      </Card>

      {member.role === "entrepreneur" && (
        <Link
          href="/profile"
          className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          Edit your business details on the Business Profile page <ArrowRight className="h-4 w-4 text-orange-500" />
        </Link>
      )}
    </div>
  );
}
