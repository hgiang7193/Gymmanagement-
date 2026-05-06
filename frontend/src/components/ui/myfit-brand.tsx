import { Flower2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MyfitBrand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,107,157,0.16)] text-[var(--primary-pink)]">
        <Flower2 className="h-7 w-7" strokeWidth={2.2} />
      </div>
      <span className="text-2xl font-bold tracking-tight text-[var(--black)]">MYFIT</span>
    </div>
  );
}
