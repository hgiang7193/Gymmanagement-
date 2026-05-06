import Link from "next/link";
import type { UserRole } from "@/lib/api/types";
import { roleNavigation } from "@/lib/auth/session";
import { SurfaceCard } from "@/components/ui/surface-card";

export function AppShell({
  role,
  title,
  description,
  children,
}: {
  role: UserRole;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const navigation = roleNavigation[role];
  const isBackoffice = role === "ADMIN" || role === "MANAGER";

  return (
    <div className="min-h-screen bg-[var(--off-white)] text-[var(--black)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className={`space-y-4 rounded-[2rem] p-5 ${isBackoffice ? "border border-[var(--charcoal)] bg-[var(--black)]" : "border border-[var(--gray-100)] bg-white"}`}>
          <div className="space-y-2">
            <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${isBackoffice ? "text-[var(--primary-pink)]" : "text-[var(--deep-pink)]"}`}>MYFIT</p>
            <h1 className={`text-2xl font-semibold ${isBackoffice ? "text-white" : "text-[var(--black)]"}`}>{title}</h1>
            <p className={`text-sm leading-6 ${isBackoffice ? "text-white/70" : "text-[var(--gray-500)]"}`}>{description}</p>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-2xl border px-4 py-3 ${isBackoffice ? "border-[var(--charcoal)] text-white/80 hover:border-[var(--primary-pink)] hover:bg-[var(--charcoal)] hover:text-white" : "border-[var(--gray-100)] text-[var(--charcoal)] hover:border-[var(--soft-pink)] hover:bg-[var(--pastel-pink)]"}`}
              >
                <div className="text-sm font-semibold">{item.label}</div>
                <div className={`text-xs ${isBackoffice ? "text-white/60" : "text-[var(--gray-500)]"}`}>{item.description}</div>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}

export function EndpointPreview({ endpoint, method, notes }: { endpoint: string; method: string; notes: string }) {
  return (
    <div className="rounded-2xl border border-[var(--gray-100)] bg-[var(--off-white)] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-[var(--black)] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">{method}</span>
        <code className="text-sm text-[var(--black)]">{endpoint}</code>
      </div>
      <p className="mt-2 text-sm text-[var(--gray-500)]">{notes}</p>
    </div>
  );
}

export function ScreenIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <SurfaceCard title={title} description={body}>
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--deep-pink)]">{eyebrow}</p>
    </SurfaceCard>
  );
}
