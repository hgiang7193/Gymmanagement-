import type { UserRole } from "@/lib/api/types";

export const roleNavigation: Record<UserRole, { href: string; label: string; description: string }[]> = {
  ADMIN: [
    { href: "/admin/branches",     label: "Chi nhánh",       description: "Tạo và quản lý chi nhánh" },
    { href: "/admin/users",        label: "Người dùng",      description: "Theo dõi trạng thái tài khoản" },
    { href: "/admin/organizations",label: "Tổ chức",         description: "Quản lý tổ chức / doanh nghiệp" },
    { href: "/admin/staff",        label: "Nhân sự",         description: "Đăng ký hồ sơ nhân viên" },
  ],
  MANAGER: [
    { href: "/manager/dashboard",          label: "Dashboard",         description: "Tổng quan vận hành chi nhánh" },
    { href: "/manager/reports",            label: "Báo cáo",           description: "5 tab: tổng quan, roster, funnel, đối soát, đánh giá" },
    { href: "/manager/reviews",            label: "Kiểm duyệt review", description: "Xử lý đánh giá bị gắn cờ" },
    { href: "/manager/trials",             label: "Trial",             description: "Cập nhật và convert trial" },
    { href: "/manager/memberships",        label: "Memberships",       description: "Kích hoạt membership" },
    { href: "/manager/check-ins",          label: "Check-in",          description: "Roster ca và override check-in" },
    { href: "/manager/course-enrollments", label: "Ghi danh khoá",     description: "Đăng ký khoá học cho hội viên" },
    { href: "/manager/pt-sessions",        label: "PT Sessions",       description: "Đặt lịch tập PT" },
    { href: "/manager/billing",            label: "Thanh toán",        description: "Hoá đơn và ghi nhận thanh toán" },
    { href: "/manager/staff",              label: "Nhân sự",           description: "Danh sách coach và nhân viên" },
    { href: "/manager/facility",           label: "Cơ sở vật chất",    description: "Thiết bị, khu vực và bảo trì" },
    { href: "/manager/branches",           label: "Chi nhánh của tôi", description: "Danh sách chi nhánh quản lý" },
  ],
  COACH: [
    { href: "/coach",        label: "Trang chủ HLV", description: "Tổng quan và hướng dẫn" },
    { href: "/coach/shifts", label: "Lịch ca tập",   description: "Xem và đăng ký ca dạy" },
  ],
  MEMBER: [
    { href: "/member/profile",      label: "Hồ sơ của tôi", description: "Hub tổng hợp gói, hoá đơn, lịch sử" },
    { href: "/member/subscription", label: "Gói tập",      description: "Gói đăng ký hiện tại" },
    { href: "/member/check-in",     label: "Check-in",     description: "Check-in ca tập hôm nay" },
    { href: "/member/enrollments",  label: "Khoá học",     description: "Danh sách khoá đã đăng ký" },
    { href: "/member/health",       label: "Sức khoẻ",     description: "Lịch sử cân nặng và số đo" },
    { href: "/member/reviews",      label: "Đánh giá",     description: "Đánh giá ca tập và HLV" },
  ],
  GUEST: [
    { href: "/",          label: "Trang chủ",     description: "Tổng quan dịch vụ" },
    { href: "/packages",  label: "Gói tập",       description: "Danh sách gói tập công khai" },
    { href: "/trials/book", label: "Đặt lịch thử",description: "Đăng ký buổi tập thử miễn phí" },
    { href: "/me/trials", label: "Lịch tập thử",  description: "Theo dõi trạng thái booking" },
    { href: "/login",     label: "Đăng nhập",     description: "Đăng nhập vào hệ thống" },
    { href: "/register",  label: "Đăng ký",       description: "Tạo tài khoản mới" },
  ],
};
