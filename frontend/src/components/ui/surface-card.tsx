import { cn } from "@/lib/utils";

export function SurfaceCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]", className)}>
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
