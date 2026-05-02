import { AppShell, ScreenIntro } from "@/components/layout/app-shell";
import { PublicPackagesCatalog } from "@/components/features/public-packages-catalog";

export const metadata = {
  title: "Gói tập | MYFIT",
  description: "Khám phá các gói tập và tìm chi nhánh gần bạn.",
};

export default function PackagesPage() {
  return (
    <AppShell role="GUEST" title="Gói tập" description="Danh sách công khai các gói tập đang được bán.">
      <ScreenIntro eyebrow="Khách hàng" title="Tìm hiểu gói dịch vụ" body="Lọc theo chi nhánh, đối chiếu giá và tham khảo gói phù hợp với mục tiêu tập luyện." />
      <PublicPackagesCatalog />
    </AppShell>
  );
}
