import { ProtectedPage } from "@/components/auth/protected-page";
import { AdminBranchesPanel } from "@/components/features/admin-branches-panel";
import { AppShell } from "@/components/layout/app-shell";

export default function AdminBranchesPage() {
  return (
    <ProtectedPage allowedRoles={["ADMIN"]}>
      <AppShell role="ADMIN" title="Admin console" description="Quản lý chi nhánh và phân công manager trong hệ thống.">
        <AdminBranchesPanel />
      </AppShell>
    </ProtectedPage>
  );
}
