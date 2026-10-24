"use client";

import { Children, isValidElement, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, Download, FileText, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// Colour-codes the three sections the memo must contain, matching the evidence panel.
const SECTION_TONES: Record<string, string> = {
  "verified facts": "border-success bg-success-soft text-[#0a6b51]",
  "entrepreneur-reported claims": "border-warning bg-warning-soft text-[#7a5212]",
  "key risks & missing evidence": "border-danger bg-danger-soft text-[#9b2a3d]",
};

function textOf(node: React.ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: React.ReactNode }>(child)
          ? textOf(child.props.children)
          : ""
    )
    .join("");
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mb-1 text-[22px] leading-tight font-extrabold tracking-[-0.6px] text-ink">{children}</h1>,
  h2: ({ children }) => {
    const tone = SECTION_TONES[textOf(children).trim().toLowerCase()];
    return (
      <h2
        className={cn(
          "mt-6 mb-2.5 text-[13px] font-bold tracking-[0.6px] uppercase",
          tone ? cn("rounded-lg border-l-4 px-3 py-1.5", tone) : "border-b border-line pb-1.5 text-ink"
        )}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children }) => <h3 className="mt-4 mb-1.5 text-[13px] font-bold text-ink">{children}</h3>,
  p: ({ children }) => <p className="my-2 text-[12.5px] leading-[1.7] text-[#3c4a62]">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 text-[12.5px] leading-[1.65] text-[#3c4a62]">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 text-[12.5px] leading-[1.65] text-[#3c4a62]">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  hr: () => <hr className="my-5 border-line" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-line bg-canvas px-2.5 py-1.5 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-line px-2.5 py-1.5 align-top">{children}</td>,
  a: ({ children, href }) => (
    <a href={href} className="text-brand underline" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
};

export function DueDiligencePackage() {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-pitch", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { markdown?: string; error?: string };
      if (!res.ok || !body.markdown) throw new Error(body.error ?? "The memo could not be generated.");
      setMarkdown(body.markdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The memo could not be generated.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[560px] text-xs leading-relaxed text-muted">
          A one-page Investment Memorandum written from your verified evidence, reported claims and audit results, ready to
          share with investors.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          {markdown && (
            <button
              type="button"
              onClick={() => window.print()}
              disabled={loading}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[11px] border border-[#d9d4ff] bg-brand-soft px-4 text-xs font-semibold text-brand-dark transition hover:bg-[#e4e0ff] disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              Download as PDF
            </button>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[11px] bg-brand px-[18px] text-xs font-semibold text-white shadow-brand transition hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : markdown ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {markdown ? "Regenerate" : "Generate Due Diligence Package"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-xl bg-brand-soft/60 p-4 text-[13px] text-brand-dark" role="status">
          <Loader2 className="h-5 w-5 animate-spin" />
          Preparing your Investment Memorandum...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-danger-soft p-4 text-[13px] text-danger" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {markdown && !loading && (
        <article className="print-area mx-auto w-full max-w-[820px] rounded-2xl border border-line bg-white px-[clamp(20px,5vw,56px)] py-[clamp(22px,5vw,48px)] shadow-soft">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-4">
            <div className="flex items-center gap-2 text-[15px] font-extrabold tracking-[-0.3px]">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-sm font-black text-white">M</span>
              MulaStream
            </div>
            <span className="text-[10px] tracking-[1.2px] text-muted uppercase">Confidential · Due Diligence Package</span>
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {markdown}
          </ReactMarkdown>
          <p className="mt-6 border-t border-line pt-3 text-[10px] leading-relaxed text-muted">
            Generated by MulaStream&apos;s AI from platform data. Verified facts reflect evidence checked on the platform;
            all other statements are unverified. Not financial advice.
          </p>
        </article>
      )}
    </div>
  );
}
