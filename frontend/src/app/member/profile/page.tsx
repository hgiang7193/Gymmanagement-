import { ProtectedPage } from "@/components/auth/protected-page";
import { MemberProfileHub } from "@/components/features/member-profile-hub";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";

export default function MemberProfilePage() {
  return (
    <ProtectedPage allowedRoles={["MEMBER", "ADMIN", "MANAGER"]}>
      <AppShell
        role="MEMBER"
        title="Hồ sơ & hoá đơn"
        description="Hub tổng hợp: lịch sử check-in, gói, hoá đơn, tiến trình sức khoẻ (UC-MEMBER-02)."
      >
        <ScreenIntro
          eyebrow="Hội viên"
          title="Đối soát dữ liệu của bạn"
          body="Bốn tab giúp kiểm tra mọi giao dịch và hoạt động tập — phù hợp khi cần tra cứu hoá đơn hoặc lịch sử điểm danh."
        />
        <MemberProfileHub />
      </AppShell>
    </ProtectedPage>
  );
}
