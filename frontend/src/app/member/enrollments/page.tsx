import { ProtectedPage } from "@/components/auth/protected-page";
import { MemberEnrollmentsPanel } from "@/components/features/member-enrollments-panel";
import { AppShell, EndpointPreview, ScreenIntro } from "@/components/layout/app-shell";

export default function MemberEnrollmentsPage() {
  return (
    <ProtectedPage allowedRoles={["MEMBER", "ADMIN", "MANAGER"]}>
      <AppShell role="MEMBER" title="Course Enrollments" description="Quan ly khoa hoc va lich su diem danh cua ban.">
        <ScreenIntro eyebrow="Member" title="My Enrollments" body="Xem danh sach khoa hoc da dang ky va theo doi so buoi da tap." />
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="space-y-3">
            <EndpointPreview method="GET" endpoint="/api/v1/member/enrollments" notes="Danh sach cac khoa hoc da dang ky." />
            <EndpointPreview method="GET" endpoint="/api/v1/member/attendance" notes="Lich su diem danh lop hoc." />
          </div>
        </div>
        <MemberEnrollmentsPanel />
      </AppShell>
    </ProtectedPage>
  );
}
