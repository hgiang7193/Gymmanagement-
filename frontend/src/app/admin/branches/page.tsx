import { ProtectedPage } from "@/components/auth/protected-page";
import { AdminBranchesPanel } from "@/components/features/admin-branches-panel";
import { AppShell, EndpointPreview, ScreenIntro } from "@/components/layout/app-shell";

export default function AdminBranchesPage() {
  return (
    <ProtectedPage allowedRoles={["ADMIN"]}>
      <AppShell role="ADMIN" title="Admin console" description="Quan ly branch inventory va manager assignment cho he thong.">
        <ScreenIntro eyebrow="Admin" title="Branches" body="Screen nay da noi vao list/create branch that tu backend." />
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="space-y-3">
            <EndpointPreview method="GET" endpoint="/api/v1/admin/branches" notes="Lay danh sach chi nhanh." />
            <EndpointPreview method="POST" endpoint="/api/v1/admin/branches" notes="Tao chi nhanh moi." />
            <EndpointPreview method="POST" endpoint="/api/v1/admin/branches/:id/managers" notes="Gan manager vao chi nhanh." />
          </div>
        </div>
        <AdminBranchesPanel />
      </AppShell>
    </ProtectedPage>
  );
}
