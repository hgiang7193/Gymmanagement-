import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerCourseEnrollmentsPanel } from "@/components/features/manager-course-enrollments-panel";
import { AppShell } from "@/components/layout/app-shell";

export default function ManagerCourseEnrollmentsPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Ghi danh khoá học" description="Đăng ký gói khoá học và cấp phát số buổi tập cho hội viên.">
        <ManagerCourseEnrollmentsPanel />
      </AppShell>
    </ProtectedPage>
  );
}
