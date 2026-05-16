import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerBranchesPanel } from "@/components/features/manager-branches-panel";
import { AppShell } from "@/components/layout/app-shell";

export default function ManagerBranchesPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Chi nhánh quản lý" description="Danh sách các chi nhánh thuộc phạm vi quản lý.">
        <ManagerBranchesPanel />
      </AppShell>
    </ProtectedPage>
  );
}
