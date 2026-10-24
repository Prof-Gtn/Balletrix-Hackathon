"use server";

import { askMentor, type MentorMessage } from "@/lib/mentor";
import { createClient } from "@/lib/supabase/server";

const MAX_MESSAGE_CHARS = 2_000;
const MAX_MESSAGES = 40;

export type MentorReply = { ok: true; reply: string } | { ok: false; error: string };

export async function sendMentorMessage(history: MentorMessage[]): Promise<MentorReply> {
  if (
    !Array.isArray(history) ||
    !history.length ||
    history.length > MAX_MESSAGES ||
    history.at(-1)?.role !== "user" ||
    !history.every(
      (m) =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim() &&
        m.content.length <= MAX_MESSAGE_CHARS
    )
  ) {
    return { ok: false, error: "Please type a message (up to 2,000 characters)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Please log in to chat with your mentor." };

  // "*" so the mentor still works before the business profile migration has run.
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  try {
    const reply = await askMentor(history, {
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Founder",
      businessName: profile?.business_name || null,
      sector: profile?.sector || null,
      description: profile?.business_description || null,
      readinessScore: profile?.readiness_score ?? 0,
      currentMonth: profile?.current_month ?? 1,
    });
    return { ok: true, reply };
  } catch (error) {
    console.error("askMentor failed", error);
    return { ok: false, error: "Your mentor couldn't reply just now. Please try again in a moment." };
  }
}
