import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex min-h-[550px] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <LoginForm mode="login" />
        <AuthPanel variant="login" />
      </div>
    </div>
  );
}
