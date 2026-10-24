"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { Brand } from "@/components/brand";
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

const inputClass =
  "h-[47px] w-full rounded-[11px] border border-[#dce3ee] bg-white px-3.5 text-ink outline-none transition placeholder:text-[#a2adbd] focus:border-[#8175fa] focus:shadow-[0_0_0_4px_#6557f51a]";

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 grid gap-2">
      <label htmlFor={id} className="text-xs font-bold text-[#3c4a62]">
        {label}
      </label>
      {children}
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  function toggleMode() {
    setMode(isSignup ? "login" : "signup");
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (isSignup && confirmPassword !== password) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { role: DEFAULT_ROLE, full_name: fullName.trim() || undefined },
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.session && data.user) {
        const profileError = await ensureProfile(supabase, data.user);
        if (profileError) setError(`Account created, but the profile could not be saved: ${profileError.message}`);
        else return openDashboard("Account created. Opening your dashboard…");
      } else {
        // Email confirmation is on: no session yet, so the profile is created on first login.
        setMessage("Check your inbox to confirm your email, then sign in.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
      } else {
        const profileError = await ensureProfile(supabase, data.user);
        if (profileError) setError(`Signed in, but the profile could not be saved: ${profileError.message}`);
        else return openDashboard("Signed in. Opening your dashboard…");
      }
    }

    setLoading(false);
  }

  // Keeps the button in its loading state while the dashboard loads.
  function openDashboard(text: string) {
    setMessage(text);
    router.push("/dashboard");
    router.refresh();
  }

  const switchButton = (label: string) => (
    <button type="button" onClick={toggleMode} className="pl-1 font-bold text-brand hover:underline">
      {label}
    </button>
  );

  return (
    <div className="w-full max-w-[430px]">
      <div className="mb-7 flex items-center justify-between gap-3 text-xs text-muted md:justify-end">
        <Brand className="text-lg md:hidden" />
        <p>
          {isSignup ? "Already have an account?" : "New to MulaStream?"}
          {switchButton(isSignup ? "Sign in" : "Create an account")}
        </p>
      </div>

      <div className="rounded-[22px] border border-[#e9edf5] bg-white p-[clamp(24px,4vw,38px)] shadow-soft">
        <h2 className="mb-2 text-[clamp(25px,3vw,28px)] font-bold tracking-[-1px]">
          {isSignup ? "Create your account" : "Welcome back"}
        </h2>
        <p className="mb-[26px] text-[13px] leading-normal text-muted">
          {isSignup ? "Join MulaStream and get your business assessed." : "Sign in to your MulaStream account."}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <Field label="Full name" id="fullName">
              <input
                id="fullName"
                autoComplete="name"
                placeholder="e.g. Arlick D."
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
          <Field label="Email address" id="email">
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Password" id="password">
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? "At least 6 characters" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          {isSignup && (
            <Field label="Confirm password" id="confirmPassword">
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 inline-flex min-h-[47px] w-full items-center justify-center gap-2 rounded-[11px] bg-brand px-[18px] font-semibold text-white shadow-brand transition hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignup ? "Create account" : "Sign in"}
            {!loading && <ArrowRight className="h-4 w-4" aria-hidden />}
          </button>

          <p
            role="status"
            aria-live="polite"
            className={cn("mt-[13px] min-h-4 text-xs", error ? "text-danger" : "text-success")}
          >
            {error ?? message}
          </p>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          {isSignup ? "Already registered?" : "Don't have an account?"}
          {switchButton(isSignup ? "Sign in" : "Sign up")}
        </p>
      </div>
    </div>
  );
}
