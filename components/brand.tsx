import { cn } from "@/lib/utils";

export function Brand({ className, hideNameOnMobile = false }: { className?: string; hideNameOnMobile?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 text-[21px] font-extrabold tracking-[-0.4px]", className)}>
      <span className="grid h-[37px] w-[37px] shrink-0 place-items-center rounded-xl bg-brand text-[22px] font-black text-white shadow-[0_3px_8px_#10182720]">
        M
      </span>
      <span className={cn(hideNameOnMobile && "max-md:hidden")}>MulaStream</span>
    </div>
  );
}
