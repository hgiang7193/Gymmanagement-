import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerCheckInsPanel } from "@/components/features/manager-check-ins-panel";
import { AppShell, EndpointPreview, ScreenIntro } from "@/components/layout/app-shell";

export default function ManagerCheckInsPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Check-Ins" description="Diem danh hoi vien vao phong tap va lop hoc.">
        <ScreenIntro eyebrow="Manager" title="Member Check-ins" body="Ghi nhan hoi vien den tap hoac tham gia lop hoc." />
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="space-y-3">
            <EndpointPreview method="POST" endpoint="/api/v1/manager/check-ins" notes="Diem danh vao phong tap." />
            <EndpointPreview method="POST" endpoint="/api/v1/manager/check-ins/class" notes="Diem danh vao lop hoc." />
          </div>
        </div>
        <ManagerCheckInsPanel />
      </AppShell>
    </ProtectedPage>
  );
}
