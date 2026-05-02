import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerCourseEnrollmentsPanel } from "@/components/features/manager-course-enrollments-panel";
import { AppShell, EndpointPreview, ScreenIntro } from "@/components/layout/app-shell";

export default function ManagerCourseEnrollmentsPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Course Enrollments" description="Ghi danh hoi vien vao cac khoa hoc hoac nhom tap.">
        <ScreenIntro eyebrow="Manager" title="Course Enrollment" body="Dang ky goi khoa hoc, cap phat so buoi tap cho hoi vien theo package." />
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="space-y-3">
            <EndpointPreview method="POST" endpoint="/api/v1/manager/course-enrollments" notes="Ghi danh vao course package." />
          </div>
        </div>
        <ManagerCourseEnrollmentsPanel />
      </AppShell>
    </ProtectedPage>
  );
}
