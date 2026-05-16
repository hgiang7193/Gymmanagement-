import Link from "next/link";
import {
  ClipboardList,
  Dumbbell,
  FileText,
  HeartPulse,
  Home,
  Star,
  UserCircle,
} from "lucide-react";

const ACTIONS: {
  href: string;
  label: string;
  hint: string;
  icon: typeof Home;
  emphasis?: boolean;
}[] = [
  {
    href: "/member/check-in",
    label: "Điểm danh ca",
    hint: "Chọn ca trong cửa sổ hợp lệ và ghi cân (UC-MEMBER-01).",
    icon: ClipboardList,
    emphasis: true,
  },
  {
    href: "/member/subscription",
    label: "Gói & buổi còn lại",
    hint: "Theo dõi hạn và quota buổi tập (UC-MEMBER-05).",
    icon: Dumbbell,
  },
  {
    href: "/member/enrollments",
    label: "Khoá học",
    hint: "Ghi danh lớp, buổi đã tập.",
    icon: Home,
  },
  {
    href: "/member/profile",
    label: "Hồ sơ & hoá đơn",
    hint: "Lịch sử check-in, gói, hoá đơn trong một hub (UC-MEMBER-02).",
    icon: UserCircle,
  },
  {
    href: "/member/health",
    label: "Sức khoẻ",
    hint: "Cân, số đo, mục tiêu (UC-MEMBER-03).",
    icon: HeartPulse,
  },
  {
    href: "/member/reviews",
    label: "Đánh giá",
    hint: "Phản hồi sau buổi tập (UC-MEMBER-04).",
    icon: Star,
  },
];

export function MemberHomeDashboard() {
  return (
    <div className="space-y-6">
      <div
        className="rounded-[1.5rem] border border-[var(--blush)] bg-white/80 px-5 py-4 shadow-[0_4px_20px_rgba(255,107,157,0.08)]"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--deep-pink)]">
          Hội viên
        </p>
        <h2 className="mt-1 text-lg font-bold text-[var(--black)]">Chào mừng quay lại phòng tập</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--gray-500)]">
          Đây là bảng điều khiển dành cho người đã có gói hoặc khoá học — tập trung điểm danh, quota và sức khoẻ.
          Khách chưa đăng ký có trải nghiệm riêng trên trang chủ công khai (gói tập, tập thử).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ACTIONS.map(({ href, label, hint, icon: Icon, emphasis }) => (
          <Link
            key={href}
            href={href}
            className={`group flex flex-col gap-2 rounded-2xl border p-4 transition-all ${
              emphasis
                ? "border-[var(--primary-pink)] bg-gradient-to-br from-[rgba(255,240,245,0.95)] to-white shadow-[0_6px_24px_rgba(255,107,157,0.18)]"
                : "border-[var(--blush)] bg-white/90 hover:border-[var(--primary-pink)] hover:shadow-[0_4px_16px_rgba(255,107,157,0.12)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--pastel-pink)" }}
              >
                <Icon className="h-5 w-5 text-[var(--primary-pink)]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--black)]">{label}</p>
                {emphasis ? (
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--deep-pink)]">
                    Ưu tiên hôm nay
                  </p>
                ) : null}
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[var(--gray-500)]">{hint}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-[var(--gray-300)] bg-[rgba(255,255,255,0.6)] px-4 py-3 text-xs text-[var(--gray-500)]">
        <FileText className="h-4 w-4 shrink-0 text-[var(--primary-pink)]" />
        <span>
          Cần hỗ trợ khi check-in lỗi? Dùng luồng &ldquo;Cần hỗ trợ&rdquo; trên màn điểm danh — quản lý xử lý theo vận hành chi nhánh.
        </span>
      </div>
    </div>
  );
}
