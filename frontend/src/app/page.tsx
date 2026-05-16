import Link from "next/link";
import { SurfaceCard } from "@/components/ui/surface-card";
import { MembershipPlansPreview } from "@/components/features/membership-plans-preview";

const staffLinks = [
  { href: "/login", label: "Đăng nhập nội bộ", hint: "Admin, quản lý, HLV, hội viên" },
  { href: "/admin/branches", label: "Admin", hint: "Chi nhánh & người dùng" },
  { href: "/manager/dashboard", label: "Quản lý chi nhánh", hint: "Vận hành ngày" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,var(--pastel-pink)_0%,var(--off-white)_42%,#f8fafc_100%)] px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-[var(--blush)] bg-white/85 px-6 py-10 shadow-[0_8px_40px_rgba(255,107,157,0.12)] lg:px-12 lg:py-14">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-40"
            style={{ background: "radial-gradient(circle, rgba(255,107,157,0.35), transparent 70%)" }}
          />
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--deep-pink)]">Dành cho khách</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-[var(--black)] md:text-4xl">
            Khám phá MYFIT trước khi trở thành hội viên
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--gray-500)]">
            Trang này phục vụ người chưa đăng ký gói: xem bảng giá, đặt buổi tập thử, tạo tài khoản khách.
            Sau khi được gán vai <strong className="font-semibold text-[var(--black)]">hội viên</strong>, bạn sẽ vào{" "}
            <strong className="font-semibold text-[var(--deep-pink)]">khu vực hội viên</strong> với điểm danh ca, gói buổi và sức khoẻ — giao diện và menu tách biệt.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/packages" className="myfit-btn-primary inline-flex h-12 items-center rounded-2xl px-6 text-sm font-bold">
              Xem bảng giá & gói
            </Link>
            <Link
              href="/trials/book"
              className="inline-flex h-12 items-center rounded-2xl border-2 border-[var(--black)] px-6 text-sm font-semibold text-[var(--black)] transition hover:bg-[var(--black)] hover:text-white"
            >
              Đặt lịch tập thử
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-2xl border border-[var(--blush)] bg-[var(--pastel-pink)] px-6 text-sm font-semibold text-[var(--deep-pink)] transition hover:bg-white"
            >
              Đã là hội viên? Đăng nhập
            </Link>
          </div>
        </section>

        <SurfaceCard title="Gói tập gợi ý" description="Rút gọn từ backend — đầy đủ hơn trên trang Gói tập.">
          <MembershipPlansPreview />
        </SurfaceCard>

        <SurfaceCard title="Đội ngũ & phát triển" description="Lối tắt kỹ thuật; không hiển thị cho người dùng cuối trong bản production thuần.">
          <div className="grid gap-3 sm:grid-cols-3">
            {staffLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-[var(--gray-300)] bg-[var(--gray-100)]/50 px-4 py-3 transition hover:border-[var(--primary-pink)] hover:bg-[var(--pastel-pink)]"
              >
                <div className="text-sm font-semibold text-[var(--black)]">{item.label}</div>
                <div className="mt-1 text-xs text-[var(--gray-500)]">{item.hint}</div>
              </Link>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </main>
  );
}
