import { ProtectedPage } from "@/components/auth/protected-page";
import { MemberSubscriptionPanel } from "@/components/features/member-subscription-panel";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";

export default function MemberSubscriptionPage() {
  return (
    <ProtectedPage allowedRoles={["MEMBER", "ADMIN", "MANAGER"]}>
      <AppShell
        role="MEMBER"
        title="Gói & buổi tập"
        description="Theo dõi gói đang hiệu lực, số buổi còn lại và thời hạn (UC-MEMBER-05)."
      >
        <ScreenIntro
          eyebrow="Hội viên"
          title="Gói đăng ký của bạn"
          body="Thông tin đồng bộ từ hệ thống. Hết buổi hoặc hết hạn — liên hệ quản lý chi nhánh để gia hạn."
        />
        <MemberSubscriptionPanel />
      </AppShell>
    </ProtectedPage>
  );
}
