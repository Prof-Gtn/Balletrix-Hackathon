"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// "icon" for headers; "sidebar" is the full-width "Log Out" row at the bottom of the sidebar.
export function SignOutButton({ variant = "icon" }: { variant?: "icon" | "sidebar" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  const Icon = loading ? Loader2 : LogOut;

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={loading}
        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition hover:text-white disabled:opacity-60"
      >
        <Icon className={loading ? "h-[18px] w-5 animate-spin" : "h-[18px] w-5"} />
        Log Out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      aria-label="Log out"
      title="Log out"
      className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-60"
    >
      <Icon className={loading ? "h-[18px] w-[18px] animate-spin" : "h-[18px] w-[18px]"} />
    </button>
  );
}
