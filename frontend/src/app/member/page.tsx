import { ProtectedPage } from "@/components/auth/protected-page";
import { MemberHomeDashboard } from "@/components/features/member-home-dashboard";
import { AppShell } from "@/components/layout/app-shell";

export default function MemberHomePage() {
  return (
    <ProtectedPage allowedRoles={["MEMBER", "ADMIN", "MANAGER"]}>
      <AppShell
        role="MEMBER"
        title="Trang chủ hội viên"
        description="Các lối tắt theo đúng use case trong phòng tập — khác với trải nghiệm khách trên trang công khai."
      >
        <MemberHomeDashboard />
      </AppShell>
    </ProtectedPage>
  );
}
