import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerReportsPanel } from "@/components/features/manager-reports-panel";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";

export default function ManagerReportsPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Báo cáo vận hành" description="5 tab tổng hợp + nút xác nhận đối soát ca cuối ngày.">
        <ScreenIntro eyebrow="Manager" title="Báo cáo vận hành" body="Tổng quan, roster, funnel trial, đối soát thu ngân, tổng hợp đánh giá." />
        <ManagerReportsPanel />
      </AppShell>
    </ProtectedPage>
  );
}
