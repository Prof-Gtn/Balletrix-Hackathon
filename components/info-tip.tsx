import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Plain-language explanations for the jargon first-time founders meet most often.
export const GLOSSARY = {
  trustPack: "The documents investors need to see before they give you money.",
  evidence: "Upload your proof here (receipts, contracts, bank statements).",
  readinessScore: "A score out of 100 showing how ready you are for investment.",
  gate: "A checkpoint. You must pass this to move to the next month.",
} as const;

// What the UI calls the due diligence package (the code, API routes and database keep "due diligence").
export const TRUST_PACK = { name: "Investor Trust Pack", subtitle: "The proof investors need to fund you." } as const;

// A small "?" that shows its explanation on hover, or on tap/keyboard focus (phones have no hover).
// Never put it inside a link or button: it is a button itself.
export function InfoTip({
  text,
  label,
  tone = "light",
  align = "center",
}: {
  text: string;
  label: string;
  tone?: "light" | "dark";
  // Where the bubble sits relative to the icon; "end" keeps it inside narrow containers like the sidebar.
  align?: "center" | "end";
}) {
  return (
    <span className="group/tip relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`${label}: ${text}`}
        className={cn(
          "grid h-5 w-5 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
          tone === "dark" ? "text-slate-500 hover:text-slate-200" : "text-gray-400 hover:text-gray-600"
        )}
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none invisible absolute top-full z-50 mt-2 w-56 rounded-lg bg-slate-900 px-3 py-2 text-left text-xs leading-relaxed font-normal text-white normal-case opacity-0 shadow-lg transition group-hover/tip:visible group-hover/tip:opacity-100 group-focus-within/tip:visible group-focus-within/tip:opacity-100",
          align === "center" ? "left-1/2 -translate-x-1/2" : "right-0"
        )}
      >
        {text}
      </span>
    </span>
  );
}
