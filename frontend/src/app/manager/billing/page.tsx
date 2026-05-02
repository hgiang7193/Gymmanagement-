import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerBillingPanel } from "@/components/features/manager-billing-panel";
import { AppShell, EndpointPreview, ScreenIntro } from "@/components/layout/app-shell";

export default function ManagerBillingPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Billing & Invoices" description="Quan ly hoa don va thanh toan cho hoi vien.">
        <ScreenIntro eyebrow="Manager" title="Billing Management" body="Tao hoa don moi va ghi nhan thanh toan tu khach hang." />
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="space-y-3">
            <EndpointPreview method="POST" endpoint="/api/v1/billing/invoices" notes="Tao hoa don moi." />
            <EndpointPreview method="POST" endpoint="/api/v1/billing/payments" notes="Ghi nhan thanh toan." />
          </div>
        </div>
        <ManagerBillingPanel />
      </AppShell>
    </ProtectedPage>
  );
}
