import { ProtectedPage } from "@/components/auth/protected-page";
import { MemberHealthPanel } from "@/components/features/member-health-panel";
import { AppShell, EndpointPreview, ScreenIntro } from "@/components/layout/app-shell";

export default function MemberHealthPage() {
  return (
    <ProtectedPage allowedRoles={["MEMBER", "ADMIN", "MANAGER"]}>
      <AppShell role="MEMBER" title="Health Tracking" description="Theo doi chi so suc khoe, can nang va so do co the.">
        <ScreenIntro eyebrow="Health" title="My Health Progress" body="Quan ly ho so suc khoe va muc tieu cua ban." />
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="space-y-3">
            <EndpointPreview method="GET" endpoint="/api/v1/health/progress" notes="Lay lich su can nang, so do va muc tieu." />
            <EndpointPreview method="PUT" endpoint="/api/v1/health/profile" notes="Cap nhat ho so suc khoe." />
            <EndpointPreview method="POST" endpoint="/api/v1/health/weight" notes="Ghi nhan can nang moi." />
            <EndpointPreview method="POST" endpoint="/api/v1/health/measurements" notes="Ghi nhan so do moi." />
          </div>
        </div>
        <MemberHealthPanel />
      </AppShell>
    </ProtectedPage>
  );
}
