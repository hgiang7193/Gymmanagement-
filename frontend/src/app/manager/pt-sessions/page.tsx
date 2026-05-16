import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerPtSessionsPanel } from "@/components/features/manager-pt-sessions-panel";
import { AppShell } from "@/components/layout/app-shell";

export default function ManagerPtSessionsPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Lịch tập PT cá nhân" description="Đặt lịch buổi tập cùng huấn luyện viên cá nhân cho hội viên.">
        <ManagerPtSessionsPanel />
      </AppShell>
    </ProtectedPage>
  );
}
