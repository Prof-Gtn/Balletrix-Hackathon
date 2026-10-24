"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChartLine, Layers, Loader2, UserRound } from "lucide-react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";
type Role = "entrepreneur" | "investor";

const ROLES: { value: Role; label: string; icon: typeof UserRound }[] = [
  { value: "entrepreneur", label: "Entrepreneur", icon: UserRound },
  { value: "investor", label: "Investor", icon: ChartLine },
];

// Where each role lands after signing in. New entrepreneurs go through onboarding first.
const HOME: Record<Role, string> = { entrepreneur: "/dashboard", investor: "/investor/dashboard" };
const AFTER_SIGNUP: Record<Role, string> = { entrepreneur: "/onboarding", investor: "/investor/dashboard" };

// Creates the user's profiles row if it doesn't exist yet. Needs a logged-in session to pass RLS,
// so it runs right after sign-up when a session is returned, and again on login to cover users
// who had to confirm their email first.
async function ensureProfile(supabase: SupabaseClient, user: User, role: Role) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, email: user.email, role }, { onConflict: "id", ignoreDuplicates: true });
  return error;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500";

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}

// Form side of the split-screen Login and Sign Up pages.
export function LoginForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("entrepreneur");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

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
      const next = AFTER_SIGNUP[role];
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // The confirmation link signs the user in through /auth/callback, then continues to `next`.
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          data: { role, full_name: fullName.trim() || undefined },
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.session && data.user) {
        const profileError = await ensureProfile(supabase, data.user, role);
        if (profileError) setError(`Account created, but the profile could not be saved: ${profileError.message}`);
        else return go(next, "Account created. Let's set up your business…");
      } else {
        setMessage("Check your inbox and click the link to confirm your email. You'll continue from there.");
        setPassword("");
        setConfirmPassword("");
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
      } else {
        const metadataRole: Role = data.user.user_metadata?.role === "investor" ? "investor" : "entrepreneur";
        const profileError = await ensureProfile(supabase, data.user, metadataRole);
        if (profileError) {
          setError(`Signed in, but the profile could not be saved: ${profileError.message}`);
        } else {
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
          const savedRole: Role = profile?.role === "investor" ? "investor" : metadataRole;
          return go(HOME[savedRole], "Signed in. Opening your dashboard…");
        }
      }
    }

    setLoading(false);
  }

  // Keeps the button in its loading state while the next page loads.
  function go(path: string, text: string) {
    setMessage(text);
    router.push(path);
    router.refresh();
  }

  return (
    <div className="flex w-full flex-col justify-center p-8 sm:p-10 md:w-1/2 md:p-12">
      <Link href="/" className={cn("flex items-center gap-2", isSignup ? "mb-8" : "mb-10")}>
        <Layers className="h-6 w-6 text-emerald-500" strokeWidth={2.5} />
        <span className="text-xl font-bold text-slate-800">MulaStream AI</span>
      </Link>
      <h2 className="mb-2 text-2xl font-bold">{isSignup ? "Create Your Account" : "Welcome Back"}</h2>
      <p className={cn("text-sm text-gray-500", isSignup ? "mb-6" : "mb-8")}>
        {isSignup ? "Join MulaStream AI and start building your future." : "Log in to your account"}
      </p>

      <form onSubmit={handleSubmit} className={isSignup ? "space-y-4" : "space-y-5"}>
        {isSignup && (
          <Field label="Full Name" id="fullName">
            <input
              id="fullName"
              autoComplete="name"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </Field>
        )}
        <Field label="Email Address" id="email">
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Enter your email"
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
            placeholder={isSignup ? "Create a strong password" : "Enter your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
        {isSignup && (
          <>
            <Field label="Confirm Password" id="confirmPassword">
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
            </Field>
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-gray-700">I am a</legend>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(({ value, label, icon: Icon }) => {
                  const selected = role === value;
                  return (
                    <label
                      key={value}
                      className={cn(
                        "cursor-pointer rounded-lg border p-3 text-center transition",
                        selected ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        checked={selected}
                        onChange={() => setRole(value)}
                        className="sr-only"
                      />
                      <Icon className={cn("mx-auto mb-1 h-4 w-4", selected ? "text-emerald-600" : "text-gray-400")} />
                      <span className={cn("text-xs font-medium", selected ? "text-emerald-700" : "text-gray-600")}>{label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-70",
            isSignup ? "mt-4 bg-emerald-500 hover:bg-emerald-600" : "bg-slate-900 hover:bg-slate-800"
          )}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSignup ? "Register" : "Log In"}
        </button>

        {(error || message) && (
          <p role="status" aria-live="polite" className={cn("text-sm", error ? "text-red-600" : "text-emerald-600")}>
            {error ?? message}
          </p>
        )}
      </form>

      {isSignup ? (
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:underline">
            Log in
          </Link>
        </p>
      ) : (
        <div className="mt-8 text-center">
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-300" />
            <span className="mx-4 flex-shrink-0 text-sm text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-300" />
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
