import type { UserRole } from "@/lib/api/types";

export const roleNavigation: Record<UserRole, { href: string; label: string; description: string }[]> = {
  // ADMIN: quản trị hệ thống + giám sát đa chi nhánh.
  // KHÔNG bao gồm các tác vụ vận hành hằng ngày của manager
  // (kích hoạt gói, ghi danh, đặt lịch PT, hoá đơn, điểm danh).
  ADMIN: [
    // ── Quản trị hệ thống ──
    { href: "/admin/branches",      label: "Chi nhánh",              description: "Tạo và quản lý toàn bộ chi nhánh" },
    { href: "/admin/users",         label: "Người dùng",             description: "Tài khoản, vai trò, trạng thái" },
    { href: "/admin/organizations", label: "Tổ chức",                description: "Cấu hình tổ chức / doanh nghiệp" },
    { href: "/admin/staff",         label: "Hồ sơ nhân sự",          description: "Đăng ký và quản lý nhân viên toàn hệ thống" },
    // ── Giám sát đa chi nhánh (xem, không thao tác trực tiếp) ──
    { href: "/manager/dashboard",   label: "Tổng quan đa chi nhánh", description: "Số liệu vận hành tổng hợp các chi nhánh" },
    { href: "/manager/reports",     label: "Báo cáo vận hành",       description: "Ca, phễu tập thử, đối soát, đánh giá" },
    { href: "/manager/reviews",     label: "Kiểm duyệt đánh giá",    description: "Xử lý đánh giá bị gắn cờ" },
    { href: "/manager/facility",    label: "Cơ sở vật chất",         description: "Thiết bị, bảo trì theo chi nhánh" },
  ],
  // MANAGER: vận hành hằng ngày 1 chi nhánh phụ trách.
  MANAGER: [
    { href: "/manager/dashboard",          label: "Tổng quan vận hành",   description: "Tổng quan hoạt động chi nhánh trong ngày" },
    { href: "/manager/reports",            label: "Báo cáo",              description: "Tổng quan, danh sách ca, phễu tập thử, đối soát, đánh giá" },
    { href: "/manager/reviews",            label: "Kiểm duyệt đánh giá",  description: "Xử lý đánh giá bị gắn cờ" },
    { href: "/manager/trials",             label: "Buổi tập thử",         description: "Cập nhật và chuyển đổi buổi tập thử" },
    { href: "/manager/memberships",        label: "Kích hoạt gói tập",    description: "Kích hoạt gói tập cho hội viên" },
    { href: "/manager/check-ins",          label: "Điểm danh",            description: "Danh sách ca và điểm danh thủ công" },
    { href: "/manager/course-enrollments", label: "Ghi danh khoá học",    description: "Đăng ký khoá học cho hội viên" },
    { href: "/manager/pt-sessions",        label: "Buổi tập PT",          description: "Đặt lịch tập với huấn luyện viên" },
    { href: "/manager/billing",            label: "Hoá đơn",              description: "Hoá đơn và ghi nhận thanh toán" },
    { href: "/manager/staff",              label: "Nhân sự",              description: "Danh sách huấn luyện viên và nhân viên" },
    { href: "/manager/facility",           label: "Cơ sở vật chất",       description: "Thiết bị, khu vực và bảo trì" },
    { href: "/manager/branches",           label: "Chi nhánh của tôi",    description: "Thông tin chi nhánh đang phụ trách" },
  ],
  COACH: [
    { href: "/coach",        label: "Trang chủ huấn luyện viên", description: "Tổng quan và hướng dẫn" },
    { href: "/coach/shifts", label: "Lịch ca tập",               description: "Xem và đăng ký ca dạy" },
  ],
  // MEMBER: ưu tiên thao tác trong phòng tập (UC-MEMBER-*), không trộn với funnel khách.
  MEMBER: [
    { href: "/member",            label: "Trang chủ",          description: "Lối tắt tới các tác vụ hội viên" },
    { href: "/member/check-in",   label: "Điểm danh ca",       description: "UC-MEMBER-01: Check-in ca + ghi cân trong cửa sổ hợp lệ" },
    { href: "/member/subscription", label: "Gói & buổi tập",   description: "UC-MEMBER-05: Gói đang dùng, buổi còn lại, hạn" },
    { href: "/member/enrollments",  label: "Khoá học",         description: "Khoá đã ghi danh và lịch sử buổi lớp" },
    { href: "/member/profile",      label: "Hồ sơ & hoá đơn",  description: "UC-MEMBER-02: Check-in, gói, hoá đơn, tiến trình (tab)" },
    { href: "/member/health",       label: "Sức khoẻ",         description: "UC-MEMBER-03: Cân, số đo, mục tiêu, hồ sơ nền" },
    { href: "/member/reviews",      label: "Đánh giá",         description: "UC-MEMBER-04: Phản hồi ca, HLV, thiết bị…" },
  ],
  GUEST: [
    { href: "/",            label: "Trang chủ",          description: "Khám phá MYFIT — dành cho khách & tập thử" },
    { href: "/packages",    label: "Bảng giá công khai", description: "Xem gói trước khi đăng ký hội viên" },
    { href: "/trials/book", label: "Đặt lịch tập thử",   description: "Đăng ký buổi tập thử miễn phí" },
    { href: "/me/trials",   label: "Lịch tập thử",       description: "Theo dõi trạng thái đặt lịch (đã đăng nhập)" },
    { href: "/login",       label: "Đăng nhập",          description: "Hội viên / nhân sự đăng nhập" },
    { href: "/register",    label: "Tạo tài khoản",      description: "Bắt đầu với tài khoản khách" },
  ],
};
