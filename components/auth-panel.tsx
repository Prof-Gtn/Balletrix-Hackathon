import { Layers } from "lucide-react";

// Right-hand side of the split auth screens: the template's premium navy-to-orange gradient with the
// MulaStream AI logo (the same layers mark as the sidebar's, large and white).
export function AuthPanel({ variant }: { variant: "login" | "signup" }) {
  return (
    <div className="investment-bg hidden flex-col items-center justify-center p-12 md:flex md:w-1/2">
      <div className="relative z-10 flex flex-col items-center">
        <Layers aria-hidden className="mb-6 h-28 w-28 text-white drop-shadow-2xl" strokeWidth={2.5} />
        <p className="text-[2rem] leading-none font-extrabold tracking-[2px] text-orange-500">MulaStream AI</p>
        <p className="mt-3 text-xs font-medium tracking-[4px] text-slate-400">Build · Prove · Grow</p>
        <div className="mt-10 h-1 w-12 rounded-full bg-orange-500" />
        {variant === "signup" ? (
          <p className="mt-6 text-center text-2xl font-bold text-white">
            Build Today.
            <br />
            Grow Tomorrow.
          </p>
        ) : (
          <p className="mt-6 max-w-xs text-center text-sm leading-relaxed font-medium text-slate-200">
            Empowering Entrepreneurs.
            <br />
            Connecting Investors.
            <br />
            Building a Stronger Future.
          </p>
        )}
      </div>
    </div>
  );
}
