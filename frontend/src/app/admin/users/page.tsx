import { ProtectedPage } from "@/components/auth/protected-page";
import { AdminUsersPanel } from "@/components/features/admin-users-panel";
import { AppShell, EndpointPreview, ScreenIntro } from "@/components/layout/app-shell";

export default function AdminUsersPage() {
  return (
    <ProtectedPage allowedRoles={["ADMIN"]}>
      <AppShell role="ADMIN" title="Admin console" description="Theo doi user status va harden van hanh co ban.">
        <ScreenIntro eyebrow="Admin" title="Users" body="Screen nay da noi vao list users va update status that tu backend." />
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="space-y-3">
            <EndpointPreview method="GET" endpoint="/api/v1/admin/users" notes="Lay danh sach users cho admin." />
            <EndpointPreview method="PATCH" endpoint="/api/v1/admin/users/:id/status" notes="Cap nhat trang thai user, can map loi cho toast UI." />
          </div>
        </div>
        <AdminUsersPanel />
      </AppShell>
    </ProtectedPage>
  );
}
