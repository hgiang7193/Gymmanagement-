import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerBranchesPanel } from "@/components/features/manager-branches-panel";
import { AppShell, EndpointPreview, ScreenIntro } from "@/components/layout/app-shell";

export default function ManagerBranchesPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Manager workspace" description="Tong quan branch scope ma manager duoc phep thao tac.">
        <ScreenIntro eyebrow="Manager" title="Managed branches" body="Screen nay da bat dau render branch scope that tu backend." />
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <EndpointPreview method="GET" endpoint="/api/v1/manager/branches" notes="Backend tu enforce branch scope, frontend chi render ket qua." />
        </div>
        <ManagerBranchesPanel />
      </AppShell>
    </ProtectedPage>
  );
}
