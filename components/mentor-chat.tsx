"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, CheckCheck, Loader2, SendHorizontal, X } from "lucide-react";
import { sendMentorMessage } from "@/app/actions/mentor";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string; time: string };

const SUGGESTIONS = [
  "How do I pass the Month 1 gate?",
  "How should I price my product?",
  "Which documents should I upload?",
  "How do I keep simple business records?",
];

const now = () => new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());

// WhatsApp-style chat with the AI Mentor, used full-page on /mentor and in the floating widget.
// The conversation lives in the browser only and is not saved.
export function MentorChat({
  firstName,
  variant = "page",
  onClose,
}: {
  firstName: string;
  variant?: "page" | "widget";
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi ${firstName}! 👋 I'm your MulaStream AI Mentor. Ask me anything about growing your business or using MulaStream.`,
      time: now(),
    },
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
      const res = await sendMentorMessage(next.slice(1).map(({ role, content }) => ({ role, content })));
      if (res.ok) setMessages((prev) => [...prev, { role: "assistant", content: res.reply, time: now() }]);
      else setError(res.error);
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-white",
        variant === "page"
          ? "h-[calc(100vh-11rem)] min-h-[520px] rounded-xl border border-gray-200 shadow-sm"
          : "h-full"
      )}
    >
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500">
          <Bot className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">AI Mentor</p>
          <p className="flex items-center gap-1.5 text-xs text-emerald-100">
            {isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> typing…
              </>
            ) : (
              "online"
            )}
          </p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close chat" className="rounded-full p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white">
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
                variant === "page" && "sm:max-w-[70%]",
                m.role === "user" ? "rounded-tr-none bg-[#d9fdd3]" : "rounded-tl-none bg-white"
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

        {messages.length === 1 && !isPending && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
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
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-3xl border-0 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={isPending || !draft.trim()}
          aria-label="Send"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
}
