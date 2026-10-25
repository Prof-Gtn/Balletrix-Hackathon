"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, CheckCheck, Loader2, SendHorizontal, X } from "lucide-react";
import { sendGuestMessage, sendMentorMessage } from "@/app/actions/mentor";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string; time: string };

// "member": the context-aware AI Mentor for logged-in users. "guest": the public MulaStream assistant.
export type ChatMode = "member" | "guest";

const MODES = {
  member: {
    title: "MulaStream AI Mentor",
    greeting: (firstName: string) =>
      `Hi ${firstName}! 👋 I'm your MulaStream AI Mentor. Ask me anything about growing your business or using MulaStream.`,
    suggestions: [
      "How do I pass the Month 1 gate?",
      "How should I price my product?",
      "Which documents should I upload?",
      "How do I keep simple business records?",
    ],
    send: sendMentorMessage,
  },
  guest: {
    title: "MulaStream Assistant",
    greeting: () =>
      "Hi there! 👋 I'm the MulaStream assistant. Ask me what MulaStream does, how debt and equity funding work, or how to sign up.",
    suggestions: ["What is MulaStream?", "Debt vs equity: what's the difference?", "How do I sign up?", "Is MulaStream for my business?"],
    send: sendGuestMessage,
  },
} as const;

const now = () => new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());

// WhatsApp-style chat, used full-page on /mentor and in the floating widget.
// The conversation lives in the browser only and is not saved.
export function MentorChat({
  firstName = "",
  mode = "member",
  variant = "page",
  onClose,
  title,
  greeting,
  quickReplies,
}: {
  firstName?: string;
  mode?: ChatMode;
  // "page": fills the screen (/mentor). "embedded": a fixed-height block inside a page (/support).
  variant?: "page" | "embedded" | "widget";
  onClose?: () => void;
  title?: string;
  greeting?: string;
  // Always-visible buttons under the input; replaces the starter suggestions shown in the chat.
  quickReplies?: string[];
}) {
  const config = MODES[mode];
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: greeting ?? config.greeting(firstName), time: now() },
  ]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isPending]);

  function send(text: string) {
    const content = text.trim();
    if (!content || isPending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content, time: now() }];
    setMessages(next);
    setDraft("");
    setError(null);

    startTransition(async () => {
      // The greeting is UI only; the model's conversation starts with the user's first message.
      const res = await config.send(next.slice(1).map(({ role, content }) => ({ role, content })));
      if (res.ok) setMessages((prev) => [...prev, { role: "assistant", content: res.reply, time: now() }]);
      else setError(res.error);
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-white",
        variant === "page" && "h-[calc(100vh-11rem)] min-h-[520px] rounded-xl border border-gray-200 shadow-sm",
        variant === "embedded" && "h-[min(640px,75vh)] min-h-[480px] rounded-2xl border border-gray-200 shadow-lg",
        variant === "widget" && "h-full"
      )}
    >
      <div className="flex items-center gap-3 bg-[#1a202c] px-4 py-3 text-white">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-500">
          <Bot className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title ?? config.title}</p>
          <p className="flex items-center gap-1.5 text-xs text-slate-300">
            {isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> typing…
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.25)]" aria-hidden />
                Online
              </>
            )}
          </p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close chat" className="rounded-full p-1.5 text-slate-300 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-[#efeae2] px-3 py-4 sm:px-6" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed text-slate-800 shadow-sm",
                variant !== "widget" && "sm:max-w-[70%]",
                m.role === "user" ? "rounded-tr-none bg-orange-100" : "rounded-tl-none bg-white"
              )}
            >
              {m.role === "assistant" ? (
                <div className="[&_li]:ml-4 [&_li]:list-disc [&_p]:my-1 [&_strong]:font-semibold [&_ul]:my-1">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
              <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-gray-500">
                {m.time}
                {m.role === "user" && <CheckCheck className="h-3.5 w-3.5 text-sky-500" />}
              </p>
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-lg rounded-tl-none bg-white px-4 py-3 shadow-sm" aria-label="Mentor is typing">
              {[0, 150, 300].map((delay) => (
                <span key={delay} className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        )}

        {!quickReplies && messages.length === 1 && !isPending && (
          <div className="flex flex-wrap gap-2 pt-2">
            {config.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="flex items-end gap-2 bg-[#f0f2f5] p-3"
      >
        <label htmlFor="mentor-message" className="sr-only">
          Message
        </label>
        <textarea
          id="mentor-message"
          rows={1}
          maxLength={2000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          placeholder="Type a message"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-3xl border-0 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          type="submit"
          disabled={isPending || !draft.trim()}
          aria-label="Send"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-orange-500 text-white transition hover:bg-orange-600 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
        </button>
      </form>

      {quickReplies && (
        <div className="flex flex-wrap gap-2 border-t border-gray-200 bg-white px-3 py-3" aria-label="Quick replies">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => send(reply)}
              disabled={isPending}
              className="rounded-full border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-semibold text-orange-800 transition hover:bg-orange-100 disabled:opacity-50"
            >
              {reply}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
