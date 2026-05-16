import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerTrialsPanel } from "@/components/features/manager-trials-panel";
import { AppShell } from "@/components/layout/app-shell";

export default function ManagerTrialsPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Quản lý trial" description="Danh sách đăng ký trải nghiệm, cập nhật trạng thái và chuyển đổi thành hội viên.">
        <ManagerTrialsPanel />
      </AppShell>
    </ProtectedPage>
  );
}
