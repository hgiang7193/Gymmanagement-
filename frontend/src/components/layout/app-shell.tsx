import Link from "next/link";
import type { UserRole } from "@/lib/api/types";
import { roleNavigation } from "@/lib/auth/session";
import { SurfaceCard } from "@/components/ui/surface-card";
import { MemberNutritionChat } from "@/components/features/member-nutrition-chat";

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
  const isMember = role === "MEMBER";

  return (
    <div
      className={`min-h-screen bg-transparent text-[var(--black)] ${isMember ? "member-app-chrome" : ""}`}
    >
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside
          className={`space-y-4 rounded-[2rem] backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(255,182,193,0.15)] ${
            isMember
              ? "border-2 border-[rgba(255,107,157,0.35)] bg-gradient-to-b from-[rgba(255,252,253,0.95)] to-[rgba(255,240,245,0.88)]"
              : "border border-[var(--blush)] bg-white/60"
          }`}
        >
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--deep-pink)]">
                {isMember ? "Khu vực hội viên" : "MYFIT"}
              </p>
              {isMember ? (
                <span className="rounded-full bg-[rgba(255,107,157,0.15)] px-2 py-0.5 text-[10px] font-bold text-[var(--deep-pink)]">
                  Đã kích hoạt
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl font-semibold text-[var(--black)]">{title}</h1>
            <p className="text-sm leading-6 text-[var(--gray-500)]">{description}</p>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`member-nav-link block rounded-2xl border px-4 py-3 transition-all ${
                  isMember
                    ? "border-transparent bg-white/55 text-[var(--charcoal)] hover:border-[var(--primary-pink)] hover:bg-white/90 hover:shadow-[0_2px_12px_rgba(255,107,157,0.12)]"
                    : "border-transparent bg-white/50 text-[var(--charcoal)] hover:border-[var(--soft-pink)] hover:bg-[var(--pastel-pink)] hover:text-[var(--deep-pink)]"
                }`}
              >
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="text-xs text-[var(--gray-500)] leading-snug">{item.description}</div>
              </Link>
            ))}
          </nav>
        </aside>

        <main className={`space-y-6 ${isMember ? "member-app-main" : ""}`}>{children}</main>
      </div>
      {isMember && <MemberNutritionChat />}
    </div>
  );
}

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-emerald-600",
  POST:   "bg-blue-600",
  PATCH:  "bg-amber-500",
  PUT:    "bg-amber-500",
  DELETE: "bg-rose-600",
};

const GROUP_COLORS: Record<string, string> = {
  slate: "text-slate-500  border-slate-200",
  rose:  "text-rose-500   border-rose-200",
  amber: "text-amber-600  border-amber-200",
  green: "text-emerald-600 border-emerald-200",
  blue:  "text-blue-600   border-blue-200",
};

export function EndpointGroup({
  label,
  color = "slate",
  children,
}: {
  label: string;
  color?: keyof typeof GROUP_COLORS;
  children: React.ReactNode;
}) {
  const cls = GROUP_COLORS[color] ?? GROUP_COLORS.slate;
  return (
    <div>
      <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.28em] ${cls.split(" ")[0]}`}>{label}</p>
      <div className={`rounded-2xl border ${cls.split(" ")[1]} divide-y divide-inherit overflow-hidden`}>
        {children}
      </div>
    </div>
  );
}

export function EndpointPreview({ endpoint, method, notes }: { endpoint: string; method: string; notes: string }) {
  const pill = METHOD_COLORS[method.toUpperCase()] ?? "bg-slate-700";
  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2.5 hover:bg-slate-50 transition-colors">
      <span className={`shrink-0 rounded-full ${pill} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white min-w-[44px] text-center`}>
        {method}
      </span>
      <code className="flex-1 truncate text-xs text-slate-800">{endpoint}</code>
      <span className="hidden shrink-0 text-xs text-slate-400 md:block">{notes}</span>
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
