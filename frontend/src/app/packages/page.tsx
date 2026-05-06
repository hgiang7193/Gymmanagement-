import Link from "next/link";
import { PublicPackagesCatalog } from "@/components/features/public-packages-catalog";

export const metadata = {
  title: "Gói tập | MYFIT",
  description: "Khám phá gói dịch vụ linh hoạt tại MYFIT.",
};

export default function PackagesPage() {
  return (
    <main className="min-h-screen bg-[var(--off-white)] pb-16">
      <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-[linear-gradient(135deg,_#FFF0F3_0%,_#FFE4E1_50%,_#E6E6FA_100%)] px-4 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,107,157,0.06),transparent_20%),radial-gradient(circle_at_75%_28%,rgba(255,107,157,0.07),transparent_24%),radial-gradient(circle_at_35%_78%,rgba(124,58,237,0.06),transparent_22%)]" />
        <div className="relative mx-auto w-full max-w-6xl">
          <span className="inline-flex rounded-full bg-[rgba(255,107,157,0.15)] px-4 py-1.5 text-xs font-bold text-[var(--primary-pink)]">✨ Trải nghiệm miễn phí</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight text-[var(--black)] md:text-5xl">Tập luyện theo cách của bạn</h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--gray-500)]">Gói linh hoạt, HLV chuyên nghiệp, cộng đồng nữ tính.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/trials/book" className="myfit-btn-primary inline-flex h-14 items-center rounded-2xl px-8 text-base">
              Đặt lịch tập thử
            </Link>
            <a
              href="#packages-grid"
              className="inline-flex h-14 items-center rounded-2xl border-2 border-[var(--black)] px-8 text-base font-semibold text-[var(--black)] hover:bg-[var(--black)] hover:text-white"
            >
              Xem bảng giá
            </a>
          </div>
        </div>
      </section>

      <section id="packages-grid" className="mx-auto mt-8 w-full max-w-6xl px-4">
        <PublicPackagesCatalog />
      </section>
    </main>
  );
}
