import { ProtectedPage } from "@/components/auth/protected-page";
import { ManagerReviewsModerationPanel } from "@/components/features/manager-reviews-moderation-panel";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";

export default function ManagerReviewsPage() {
  return (
    <ProtectedPage allowedRoles={["MANAGER", "ADMIN"]}>
      <AppShell role="MANAGER" title="Kiểm duyệt review" description="Xử lý các review bị gắn cờ hoặc cần ẩn nội dung vi phạm.">
        <ScreenIntro eyebrow="Manager" title="Hàng đợi kiểm duyệt" body="Mỗi thay đổi trạng thái cần lý do bắt buộc và được ghi vào review_moderation_logs." />
        <ManagerReviewsModerationPanel />
      </AppShell>
    </ProtectedPage>
  );
}
