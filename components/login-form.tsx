"use client";

import { useEffect, useState } from "react";
import { Loader2, LogOut, Mail, UserPlus } from "lucide-react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

const DEFAULT_ROLE = "entrepreneur";

// Creates the user's profiles row if it doesn't exist yet. Needs a logged-in session to pass RLS,
// so it runs right after sign-up when a session is returned, and again on login to cover users
// who had to confirm their email first.
async function ensureProfile(supabase: SupabaseClient, user: User) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, email: user.email, role: DEFAULT_ROLE }, { onConflict: "id", ignoreDuplicates: true });
  return error;
}

export function LoginForm() {
  const [supabase] = useState(createClient);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  function switchMode(next: Mode) {
    setMode(next);
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { role: DEFAULT_ROLE } },
      });

      if (error) {
        setError(error.message);
      } else if (data.session && data.user) {
        const profileError = await ensureProfile(supabase, data.user);
        if (profileError) setError(`Account created, but the profile could not be saved: ${profileError.message}`);
      } else {
        // Email confirmation is on: no session yet, so the profile is created on first login.
        setMessage("Check your inbox to confirm your email, then log in.");
        setMode("login");
        setPassword("");
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
      } else {
        const profileError = await ensureProfile(supabase, data.user);
        if (profileError) setError(`Logged in, but the profile could not be saved: ${profileError.message}`);
      }
    }

    setLoading(false);
  }

  if (user) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm">
          Signed in as <span className="font-medium">{user.email}</span>
        </p>
        {error && <p className="max-w-sm text-center text-sm text-red-600">{error}</p>}
        <button
          onClick={() => supabase.auth.signOut()}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-zinc-50"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    );
  }

  const isSignup = mode === "signup";

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
      <div className="grid grid-cols-2 rounded-md border p-1 text-sm">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={cn("rounded px-3 py-1.5", mode === m ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50")}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>
      <input
        type="email"
        required
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder="Password"
        autoComplete={isSignup ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
      />
      <button
        type="submit"
        disabled={loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800",
          loading && "cursor-not-allowed opacity-70"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSignup ? (
          <UserPlus className="h-4 w-4" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {isSignup ? "Create account" : "Login with Email"}
      </button>
      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
