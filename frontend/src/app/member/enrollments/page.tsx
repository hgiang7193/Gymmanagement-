import { ProtectedPage } from "@/components/auth/protected-page";
import { MemberEnrollmentsPanel } from "@/components/features/member-enrollments-panel";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";

export default function MemberEnrollmentsPage() {
  return (
    <ProtectedPage allowedRoles={["MEMBER", "ADMIN", "MANAGER"]}>
      <AppShell
        role="MEMBER"
        title="Khoá học"
        description="Các khoá bạn đã ghi danh và tiến độ buổi tập lớp."
      >
        <ScreenIntro
          eyebrow="Hội viên"
          title="Ghi danh & buổi lớp"
          body="Xem khoá đang học, buổi đã tập và lịch sử điểm danh lớp (bổ sung cho màn điểm danh ca chung)."
        />
        <MemberEnrollmentsPanel />
      </AppShell>
    </ProtectedPage>
  );
}
