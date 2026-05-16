import { ProtectedPage } from "@/components/auth/protected-page";
import { MemberHealthPanel } from "@/components/features/member-health-panel";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";

export default function MemberHealthPage() {
  return (
    <ProtectedPage allowedRoles={["MEMBER", "ADMIN", "MANAGER"]}>
      <AppShell
        role="MEMBER"
        title="Sức khoẻ"
        description="Hồ sơ nền, cân nặng, số đo và mục tiêu — phục vụ tư vấn và theo dõi tiến trình (UC-MEMBER-03)."
      >
        <ScreenIntro
          eyebrow="Hội viên"
          title="Tiến trình & chỉ số"
          body="Dữ liệu dùng chung với luồng điểm danh (cân tại ca). Cập nhật đều đặn giúp HLV và hệ thống gợi ý chính xác hơn."
        />
        <MemberHealthPanel />
      </AppShell>
    </ProtectedPage>
  );
}
