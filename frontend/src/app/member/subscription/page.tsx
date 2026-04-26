import { ProtectedPage } from "@/components/auth/protected-page";
import { MemberSubscriptionPanel } from "@/components/features/member-subscription-panel";
import { AppShell, EndpointPreview, ScreenIntro } from "@/components/layout/app-shell";

export default function MemberSubscriptionPage() {
  return (
    <ProtectedPage allowedRoles={["MEMBER", "ADMIN", "MANAGER"]}>
      <AppShell role="MEMBER" title="Member area" description="Trang ca nhan de member xem trang thai subscription hien tai.">
        <ScreenIntro eyebrow="Member" title="My subscription" body="UI nay da bat dau render subscription that tu backend." />
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="space-y-3">
            <EndpointPreview method="GET" endpoint="/api/v1/me/subscription" notes="Endpoint uu tien cho member area moi." />
            <EndpointPreview method="GET" endpoint="/api/v1/memberships/me" notes="Alias backward-compatible con duoc giu cho contract cu." />
          </div>
        </div>
        <MemberSubscriptionPanel />
      </AppShell>
    </ProtectedPage>
  );
}
