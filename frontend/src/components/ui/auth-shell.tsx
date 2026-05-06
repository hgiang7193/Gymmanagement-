import { MyfitBrand } from "@/components/ui/myfit-brand";

export function AuthShell({
  title,
  subtitle,
  children,
  cardPaddingClassName = "p-10",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  cardPaddingClassName?: string;
}) {
  return (
    <main className="myfit-auth-bg myfit-auth-pattern flex min-h-screen items-center justify-center px-4 py-12">
      <section className={`myfit-card w-full max-w-[420px] ${cardPaddingClassName}`}>
        <header className="mb-8 text-center">
          <MyfitBrand />
          <p className="mt-2 text-sm text-[var(--gray-500)]">{subtitle}</p>
          <h1 className="sr-only">{title}</h1>
        </header>
        {children}
      </section>
    </main>
  );
}
