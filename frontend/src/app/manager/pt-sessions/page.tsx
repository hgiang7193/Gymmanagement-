import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerPtSessionsPanel } from "@/components/features/manager-pt-sessions-panel";
import { AppShell, EndpointPreview, ScreenIntro } from "@/components/layout/app-shell";

export default function ManagerPtSessionsPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="PT Sessions" description="Dat lich va quan ly buoi tap PT ca nhan.">
        <ScreenIntro eyebrow="Manager" title="PT Session Booking" body="Dat lich tap luyen cung Huan luyen vien ca nhan cho hoi vien." />
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="space-y-3">
            <EndpointPreview method="POST" endpoint="/api/v1/manager/pt-sessions" notes="Dat lich buoi tap PT (se tru vao PT Package hoat dong)." />
          </div>
        </div>
        <ManagerPtSessionsPanel />
      </AppShell>
    </ProtectedPage>
  );
}
