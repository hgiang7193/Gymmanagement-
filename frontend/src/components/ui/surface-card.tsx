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
    <section className={cn("myfit-surface rounded-3xl p-6", className)}>
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold text-[var(--black)]">{title}</h2>
        {description ? <p className="text-sm text-[var(--gray-500)]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
