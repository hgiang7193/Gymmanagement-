import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerBillingPanel } from "@/components/features/manager-billing-panel";
import { AppShell } from "@/components/layout/app-shell";

export default function ManagerBillingPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Hoá đơn & Thanh toán" description="Tạo hoá đơn mới và ghi nhận thanh toán từ khách hàng.">
        <ManagerBillingPanel />
      </AppShell>
    </ProtectedPage>
  );
}
