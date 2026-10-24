import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex min-h-[600px] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <LoginForm mode="signup" />
        <AuthPanel variant="signup" />
      </div>
    </div>
  );
}
