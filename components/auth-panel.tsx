// Right-hand side of the split auth screens: the template's premium navy-to-orange gradient with the
// MulaStream AI logo.
export function AuthPanel({ variant }: { variant: "login" | "signup" }) {
  return (
    <div className="investment-bg hidden flex-col items-center justify-center p-12 md:flex md:w-1/2">
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-4 h-36 w-40 drop-shadow-2xl">
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
            <path d="M 10,80 Q 50,100 90,10" fill="none" stroke="#7ca3ca" strokeWidth="6" strokeLinecap="round" />
            <polygon points="80,0 100,5 85,25" fill="#7ca3ca" />
            <polygon points="15,80 25,80 25,50 20,40 15,50" fill="#f97316" />
            <polygon points="40,75 50,75 50,35 45,25 40,35" fill="#f97316" />
            <polygon points="65,70 75,70 75,20 70,10 65,20" fill="#f97316" />
          </svg>
        </div>
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
