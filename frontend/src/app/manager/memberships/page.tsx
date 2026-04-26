import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerMembershipsPanel } from "@/components/features/manager-memberships-panel";
import { AppShell, EndpointPreview, ScreenIntro } from "@/components/layout/app-shell";

export default function ManagerMembershipsPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Manager workspace" description="Kich hoat membership cho member tu giao dien van hanh.">
        <ScreenIntro eyebrow="Manager" title="Membership activation" body="Screen nay da duoc noi vao mutation kich hoat membership that tu backend." />
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <EndpointPreview method="POST" endpoint="/api/v1/manager/memberships/activate" notes="Tao subscription active cho user va map loi nghiep vu sang toast." />
        </div>
        <ManagerMembershipsPanel />
      </AppShell>
    </ProtectedPage>
  );
}
