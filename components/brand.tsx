import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

// "MulaStream AI" wordmark from the template: emerald layers icon beside the name.
export function Brand({ className, hideNameOnMobile = false }: { className?: string; hideNameOnMobile?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 text-xl font-bold tracking-tight", className)}>
      <Layers className="h-6 w-6 shrink-0 text-emerald" strokeWidth={2.5} />
      <span className={cn(hideNameOnMobile && "max-md:hidden")}>MulaStream AI</span>
    </div>
  );
}
