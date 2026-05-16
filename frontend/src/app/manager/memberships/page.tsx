import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerMembershipsPanel } from "@/components/features/manager-memberships-panel";
import { AppShell } from "@/components/layout/app-shell";

export default function ManagerMembershipsPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell
        role="MANAGER"
        title="Kích hoạt gói tập"
        description="Kích hoạt gói tập cho hội viên sau khi xác nhận thanh toán."
      >
        <ManagerMembershipsPanel />
      </AppShell>
    </ProtectedPage>
  );
}
