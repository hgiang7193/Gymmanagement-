import type { UserRole } from "@/lib/api/types";

export const roleNavigation: Record<UserRole, { href: string; label: string; description: string }[]> = {
  ADMIN: [
    { href: "/admin/branches", label: "Branches", description: "Tao va quan ly chi nhanh" },
    { href: "/admin/users", label: "Users", description: "Theo doi trang thai user" },
  ],
  MANAGER: [
    { href: "/manager/branches", label: "My branches", description: "Danh sach chi nhanh quan ly" },
    { href: "/manager/trials", label: "Trials", description: "Cap nhat va convert trial" },
    { href: "/manager/memberships", label: "Memberships", description: "Kich hoat membership" },
  ],
  COACH: [
    { href: "/coach", label: "Trang chu HLV", description: "Tong quan va huong dan" },
    { href: "/coach/shifts", label: "Lich ca tap", description: "Xem va dang ky ca day" },
  ],
  MEMBER: [
    { href: "/member/subscription", label: "Subscription", description: "Goi dang ky hien tai" },
  ],
  GUEST: [
    { href: "/", label: "Plans", description: "Danh sach goi tap cong khai" },
    { href: "/login", label: "Login", description: "Dang nhap vao he thong" },
  ],
};
