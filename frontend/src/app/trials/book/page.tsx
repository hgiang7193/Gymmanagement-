import { ProtectedPage } from "@/components/auth/protected-page";
import { GuestTrialBookingPanel } from "@/components/features/guest-trial-booking-panel";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";

export default function BookTrialPage() {
  return (
    <ProtectedPage allowedRoles={["GUEST", "MEMBER", "ADMIN", "MANAGER"]}>
      <AppShell role="GUEST" title="Tập thử miễn phí" description="Đặt một buổi tập thử để trải nghiệm dịch vụ trước khi đăng ký gói chính thức.">
        <ScreenIntro eyebrow="Khách hàng tiềm năng" title="Đặt lịch tập thử" body="Chọn chi nhánh, thời gian phù hợp và chúng tôi sẽ liên hệ xác nhận." />
        <GuestTrialBookingPanel />
      </AppShell>
    </ProtectedPage>
  );
}
