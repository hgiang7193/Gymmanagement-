import Link from "next/link";
import { SurfaceCard } from "@/components/ui/surface-card";
import { EndpointPreview } from "@/components/layout/app-shell";
import { MembershipPlansPreview } from "@/components/features/membership-plans-preview";

const quickLinks = [
  { href: "/login", label: "Dang nhap", hint: "Vao admin, manager, member flows" },
  { href: "/admin/branches", label: "Admin", hint: "Branches, users, manager assignment" },
  { href: "/manager/trials", label: "Manager", hint: "Trials, convert, memberships" },
  { href: "/member/subscription", label: "Member", hint: "Current subscription" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.28),_transparent_24%),linear-gradient(180deg,_#fff7ed_0%,_#ffffff_45%,_#eff6ff_100%)] px-4 py-8 lg:px-8">
      <div className="mx-auto space-y-6 max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <SurfaceCard title="MYFIT Web MVP" description="Frontend foundation da duoc scaffold theo contract backend thuc te.">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-600">Phase 1 foundation</p>
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950">Public plans va dashboard skeleton cho Admin, Manager, Member.</h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600">
                  Dot nay khoa auth theo JSON token flow, dung TanStack Query cho data fetching, va giu response envelope theo <code>{'{ data, error, meta }'}</code>.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {quickLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-amber-300 hover:bg-amber-50">
                    <div className="text-base font-semibold text-slate-900">{item.label}</div>
                    <div className="mt-1 text-sm text-slate-600">{item.hint}</div>
                  </Link>
                ))}
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Contract freeze" description="Nhung endpoint sau da duoc xac nhan cho web MVP hien tai.">
            <div className="space-y-3">
              <EndpointPreview method="GET" endpoint="/api/v1/membership-plans" notes="Public landing page data source" />
              <EndpointPreview method="POST" endpoint="/api/v1/auth/login" notes="Tra accessToken + refreshToken trong JSON" />
              <EndpointPreview method="GET" endpoint="/api/v1/manager/trials" notes="Manager screen core list" />
              <EndpointPreview method="POST" endpoint="/api/v1/manager/memberships/activate" notes="Manager action de convert doanh thu" />
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard title="Membership plans" description="Danh sach goi tap hien dang lay tu backend that.">
          <MembershipPlansPreview />
        </SurfaceCard>
      </div>
    </main>
  );
}
