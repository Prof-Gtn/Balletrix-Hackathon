"use client";

import { useEffect, useState } from "react";
import { Loader2, LogOut, Mail } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Picks up the session when the user returns from the magic link.
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  if (user) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm">
          Signed in as <span className="font-medium">{user.email}</span>
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-zinc-50"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="flex w-full max-w-sm flex-col gap-3">
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800",
          status === "sending" && "cursor-not-allowed opacity-70"
        )}
      >
        {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        Login with Email
      </button>
      {status === "sent" && <p className="text-sm text-green-600">Check your inbox for the login link.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
