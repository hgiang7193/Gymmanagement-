import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerCheckInsPanel } from "@/components/features/manager-check-ins-panel";
import { AppShell } from "@/components/layout/app-shell";

export default function ManagerCheckInsPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Điểm danh hội viên" description="Ghi nhận hội viên vào phòng tập hoặc lớp học.">
        <ManagerCheckInsPanel />
      </AppShell>
    </ProtectedPage>
  );
}
