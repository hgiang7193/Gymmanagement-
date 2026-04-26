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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_28%),linear-gradient(180deg,_#fff7ed_0%,_#f8fafc_45%,_#eef2ff_100%)] text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="space-y-4 rounded-[2rem] border border-black/10 bg-white/80 p-5 backdrop-blur">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">MYFIT</p>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm leading-6 text-slate-600">{description}</p>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-amber-300 hover:bg-amber-50"
              >
                <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                <div className="text-xs text-slate-500">{item.description}</div>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">{method}</span>
        <code className="text-sm text-slate-900">{endpoint}</code>
      </div>
      <p className="mt-2 text-sm text-slate-600">{notes}</p>
    </div>
  );
}

export function ScreenIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <SurfaceCard title={title} description={body} className="bg-white/85">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-600">{eyebrow}</p>
    </SurfaceCard>
  );
}
