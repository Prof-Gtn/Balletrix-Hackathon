"use server";

import { headers } from "next/headers";
import { askGuestAssistant, askMentor, type MentorMessage } from "@/lib/mentor";
import { loadPreferredLanguage } from "@/lib/preferred-language";
import { toRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

const MAX_MESSAGE_CHARS = 2_000;
const MAX_MESSAGES = 40;
// The visitor chat is public, so it's held to tighter limits.
const GUEST_MAX_MESSAGE_CHARS = 1_000;
const GUEST_MAX_MESSAGES = 20;
const GUEST_RATE_LIMIT = { messages: 15, windowMs: 10 * 60 * 1000 };

export type MentorReply = { ok: true; reply: string } | { ok: false; error: string };

function isValidHistory(history: unknown, maxMessages: number, maxChars: number): history is MentorMessage[] {
  return (
    Array.isArray(history) &&
    history.length > 0 &&
    history.length <= maxMessages &&
    history.at(-1)?.role === "user" &&
    history.every(
      (m) =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim() &&
        m.content.length <= maxChars
    )
  );
}

// Best-effort per-visitor limit for the public chat. It's kept in this server process's memory, so it
// resets on restart and isn't shared between instances; use a shared store (e.g. Redis) in production.
const guestRequests = new Map<string, number[]>();

function allowGuestRequest(key: string): boolean {
  const now = Date.now();
  const recent = (guestRequests.get(key) ?? []).filter((t) => now - t < GUEST_RATE_LIMIT.windowMs);
  if (recent.length >= GUEST_RATE_LIMIT.messages) {
    guestRequests.set(key, recent);
    return false;
  }
  recent.push(now);
  guestRequests.set(key, recent);
  return true;
}

// The assistant for visitors who aren't logged in: explains MulaStream, debt vs equity, and signing up.
export async function sendGuestMessage(history: MentorMessage[]): Promise<MentorReply> {
  if (!isValidHistory(history, GUEST_MAX_MESSAGES, GUEST_MAX_MESSAGE_CHARS)) {
    return { ok: false, error: "Please type a shorter message (up to 1,000 characters)." };
  }

  const requestHeaders = await headers();
  const visitor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  if (!allowGuestRequest(visitor)) {
    return { ok: false, error: "You've sent a lot of messages. Please wait a few minutes, or sign up to chat with your AI Mentor." };
  }

  try {
    // Visitors choose a language on the landing page; it's kept in a cookie.
    const language = await loadPreferredLanguage(await createClient(), null);
    return { ok: true, reply: await askGuestAssistant(history, language) };
  } catch (error) {
    console.error("askGuestAssistant failed", error);
    return { ok: false, error: "The assistant couldn't reply just now. Please try again in a moment." };
  }
}

export async function sendMentorMessage(history: MentorMessage[]): Promise<MentorReply> {
  if (!isValidHistory(history, MAX_MESSAGES, MAX_MESSAGE_CHARS)) {
    return { ok: false, error: "Please type a message (up to 2,000 characters)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Please log in to chat with your mentor." };

  // "*" so the mentor still works before the business profile migration has run.
  const [{ data: profile }, language] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    loadPreferredLanguage(supabase, user.id),
  ]);

  try {
    const reply = await askMentor(
      history,
      {
        role: toRole(profile?.role),
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Founder",
        businessName: profile?.business_name || null,
        sector: profile?.sector || null,
        description: profile?.business_description || null,
        readinessScore: profile?.readiness_score ?? 0,
        currentMonth: profile?.current_month ?? 1,
      },
      language
    );
    return { ok: true, reply };
  } catch (error) {
    console.error("askMentor failed", error);
    return { ok: false, error: "Your mentor couldn't reply just now. Please try again in a moment." };
  }
}
