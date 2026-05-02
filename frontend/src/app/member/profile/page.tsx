import { ProtectedPage } from "@/components/auth/protected-page";
import { MemberProfileHub } from "@/components/features/member-profile-hub";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";

export default function MemberProfilePage() {
  return (
    <ProtectedPage allowedRoles={["MEMBER", "ADMIN", "MANAGER"]}>
      <AppShell role="MEMBER" title="Hồ sơ của tôi" description="Tổng hợp toàn bộ dữ liệu cá nhân: lịch sử check-in, gói, hoá đơn, sức khoẻ.">
        <ScreenIntro eyebrow="Member" title="Hồ sơ của tôi" body="4 tab cho phép tự đối soát mọi dữ liệu của bạn trong hệ thống." />
        <MemberProfileHub />
      </AppShell>
    </ProtectedPage>
  );
}
