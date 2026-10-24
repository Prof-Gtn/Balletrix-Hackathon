import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only same-site paths, so the link can't be used to redirect people to another site.
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

// Target of the email confirmation link: exchanges the code for a session, makes sure the user has a
// profiles row (they may never have logged in through the form), then continues to `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!code) return NextResponse.redirect(`${origin}/login`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("Email confirmation failed", error);
    return NextResponse.redirect(`${origin}/login`);
  }

  const role = data.user.user_metadata?.role === "investor" ? "investor" : "entrepreneur";
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: data.user.id, email: data.user.email, role }, { onConflict: "id", ignoreDuplicates: true });
  if (profileError) console.error("Creating profile after confirmation failed", profileError);

  return NextResponse.redirect(`${origin}${next}`);
}
