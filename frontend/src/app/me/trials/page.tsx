import { ProtectedPage } from "@/components/auth/protected-page";
import { GuestTrialTrackingPanel } from "@/components/features/guest-trial-tracking-panel";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";

export default function MyTrialsPage() {
  return (
    <ProtectedPage allowedRoles={["GUEST", "MEMBER", "ADMIN", "MANAGER"]}>
      <AppShell role="GUEST" title="Tập thử của tôi" description="Theo dõi trạng thái các buổi tập thử bạn đã đặt.">
        <ScreenIntro eyebrow="Khách hàng tiềm năng" title="Lịch tập thử" body="Trạng thái cập nhật real-time: đã đặt → xác nhận → tham gia → chuyển đổi." />
        <GuestTrialTrackingPanel />
      </AppShell>
    </ProtectedPage>
  );
}
