import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerTrialsPanel } from "@/components/features/manager-trials-panel";
import { AppShell, EndpointPreview, ScreenIntro } from "@/components/layout/app-shell";

export default function ManagerTrialsPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Manager workspace" description="Danh sach trial, cap nhat status, va convert sang member.">
        <ScreenIntro eyebrow="Manager" title="Trials" body="Day la screen co gia tri nghiep vu cao nhat trong dot UI MVP dau tien va da bat dau noi vao data that." />
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="space-y-3">
            <EndpointPreview method="GET" endpoint="/api/v1/manager/trials" notes="Lay trial trong branch manager quan ly." />
            <EndpointPreview method="PATCH" endpoint="/api/v1/manager/trials/:id/status" notes="Cap nhat trial status voi error handling than thien." />
            <EndpointPreview method="POST" endpoint="/api/v1/manager/trials/:id/convert" notes="Convert trial thanh member theo plan + home branch." />
          </div>
        </div>
        <ManagerTrialsPanel />
      </AppShell>
    </ProtectedPage>
  );
}
