"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Key,
  Edit2,
  MoreHorizontal,
  Lock,
  AlertTriangle,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

type UserRow = {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  employee_code?: string;
  primary_role?: string;
  branch_name?: string;
  status: string;
  created_at?: string;
  is_last_admin?: boolean;
};

type Branch = {
  id: string;
  code: string;
  name: string;
  region?: string;
  status: string;
};

type RoleAssignment = {
  id: string;
  roleCode: string;
  roleName: string | null;
  branchId: string | null;
};

type CreateUserPayload = {
  email: string;
  full_name: string;
  phone: string;
  employee_code: string;
  role: string;
  branch_id: string;
  job_title: string;
  notes: string;
  branch_ids: string[];
  permissions: string[];
};

const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];
const ASSIGNABLE_ROLES = ["MEMBER", "COACH", "MANAGER", "ADMIN"];

const ROLE_FILTER_CHIPS = ["ALL", "ADMIN", "MANAGER", "COACH", "MEMBER", "GUEST"] as const;
type RoleFilter = (typeof ROLE_FILTER_CHIPS)[number];

const ROLE_META: Record<string, { label: string; border: string; bg: string; text: string; avatarBg: string }> = {
  ADMIN:   { label: "Admin",   border: "#FB7185", bg: "#FFF1F2", text: "#FB7185", avatarBg: "#FB7185" },
  MANAGER: { label: "Manager", border: "#C4B5FD", bg: "#F5F3FF", text: "#7C3AED", avatarBg: "#7C3AED" },
  COACH:   { label: "Coach",   border: "#6EE7B7", bg: "#F0FFF4", text: "#059669", avatarBg: "#059669" },
  MEMBER:  { label: "Member",  border: "#FBCFE8", bg: "#FFF0F3", text: "#FF6B9D", avatarBg: "#FF6B9D" },
  GUEST:   { label: "Guest",   border: "#D1D5DB", bg: "#F9FAFB", text: "#6B7280", avatarBg: "#D1D5DB" },
};

const CHIP_ACTIVE_STYLE: Record<RoleFilter, React.CSSProperties> = {
  ALL:     { background: "var(--black)", color: "#fff", borderColor: "var(--black)" },
  ADMIN:   { background: "#FB7185", color: "#fff", borderColor: "#FB7185" },
  MANAGER: { background: "#7C3AED", color: "#fff", borderColor: "#7C3AED" },
  COACH:   { background: "#059669", color: "#fff", borderColor: "#059669" },
  MEMBER:  { background: "var(--primary-pink)", color: "#fff", borderColor: "var(--primary-pink)" },
  GUEST:   { background: "#9CA3AF", color: "#fff", borderColor: "#9CA3AF" },
};

const PERMISSIONS = [
  { key: "view_revenue", label: "Xem báo cáo doanh thu", desc: "Truy cập màn hình báo cáo & xuất Excel", defaultOn: true },
  { key: "manage_members", label: "Quản lý hội viên", desc: "Tạo, sửa, dừng gói tập hội viên", defaultOn: true },
  { key: "approve_refunds", label: "Duyệt hoàn tiền", desc: "Xử lý yêu cầu hoàn tiền từ hội viên", defaultOn: false },
  { key: "manage_staff", label: "Quản lý nhân sự chi nhánh", desc: "Thêm, sửa thông tin HLV trong chi nhánh", defaultOn: false },
  { key: "checkin", label: "Check-in hội viên", desc: "Điểm danh và proxy check-in", defaultOn: true },
  { key: "view_health", label: "Xem thông tin sức khoẻ hội viên", desc: "Truy cập hồ sơ sức khoẻ và đo lường", defaultOn: false },
];

const ERROR_MESSAGES: Record<string, string> = {
  LAST_ADMIN_PROTECTED: "Không thể vô hiệu hóa Admin cuối cùng còn active.",
  ROLE_ALREADY_ASSIGNED: "User đã có role này rồi.",
  ROLE_NOT_ASSIGNED: "User chưa có role này để revoke.",
  BRANCH_ID_REQUIRED: "Role MANAGER cần branch đi kèm.",
  INVALID_ROLE_CODE: "Role không hợp lệ.",
};

function humanError(error: unknown) {
  const code = error instanceof Error ? error.message : String(error);
  return ERROR_MESSAGES[code] ?? code;
}

function getInitials(name: string): string {
  return (name || "?")
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function AdminUsersPanel() {
  const queryClient = useQueryClient();
  const { authorizedRequest } = useAuth();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ roleCode: "MEMBER", branchId: "" });

  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [soStep, setSoStep] = useState(1);
  const [soForm, setSoForm] = useState<CreateUserPayload>({
    email: "", full_name: "", phone: "", employee_code: "",
    role: "", branch_id: "", job_title: "", notes: "",
    branch_ids: [], permissions: PERMISSIONS.filter((p) => p.defaultOn).map((p) => p.key),
  });

  const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetPwTarget, setResetPwTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);

  const [openMoreId, setOpenMoreId] = useState<string | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setOpenMoreId(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await authorizedRequest<UserRow[]>("/api/v1/admin/users")).data,
  });

  const branchesQuery = useQuery({
    queryKey: ["admin-branches-lite"],
    queryFn: async () => (await authorizedRequest<Branch[]>("/api/v1/admin/branches")).data,
  });

  const rolesQuery = useQuery({
    queryKey: ["admin-user-roles", expandedUserId],
    enabled: !!expandedUserId,
    queryFn: async () =>
      (await authorizedRequest<RoleAssignment[]>(`/api/v1/admin/users/${expandedUserId}/roles`)).data,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await authorizedRequest<UserRow>(`/api/v1/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => toast.error(humanError(error)),
  });

  const assignRoleMutation = useMutation({
    mutationFn: async (payload: { userId: string; roleCode: string; branchId: string | null }) => {
      const response = await authorizedRequest<RoleAssignment>(
        `/api/v1/admin/users/${payload.userId}/roles`,
        {
          method: "POST",
          body: JSON.stringify({
            roleCode: payload.roleCode,
            branchId: payload.branchId || undefined,
          }),
        },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Đã gán role");
      setAssignForm({ roleCode: "MEMBER", branchId: "" });
      void queryClient.invalidateQueries({ queryKey: ["admin-user-roles", expandedUserId] });
    },
    onError: (error) => toast.error(humanError(error)),
  });

  const revokeRoleMutation = useMutation({
    mutationFn: async (payload: { userId: string; roleCode: string; branchId: string | null }) => {
      const qs = payload.branchId ? `?branch_id=${encodeURIComponent(payload.branchId)}` : "";
      await authorizedRequest(
        `/api/v1/admin/users/${payload.userId}/roles/${payload.roleCode}${qs}`,
        { method: "DELETE" },
      );
    },
    onSuccess: () => {
      toast.success("Đã gỡ role");
      void queryClient.invalidateQueries({ queryKey: ["admin-user-roles", expandedUserId] });
    },
    onError: (error) => toast.error(humanError(error)),
  });

  const createUserMutation = useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const response = await authorizedRequest<UserRow>("/api/v1/admin/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Đã tạo nhân sự. Email đặt mật khẩu đã được gửi.");
      setSlideOverOpen(false);
      setSoStep(1);
      setSoForm({
        email: "", full_name: "", phone: "", employee_code: "",
        role: "", branch_id: "", job_title: "", notes: "",
        branch_ids: [], permissions: PERMISSIONS.filter((p) => p.defaultOn).map((p) => p.key),
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => toast.error(humanError(error)),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      await authorizedRequest(`/api/v1/admin/users/${userId}/reset-password`, { method: "POST" });
    },
    onSuccess: () => {
      toast.success("Email đặt lại mật khẩu đã được gửi");
      setResetPwTarget(null);
      setDetailUser(null);
    },
    onError: (error) => toast.error(humanError(error)),
  });

  const allUsers = usersQuery.data ?? [];

  const stats = {
    total: allUsers.length,
    admin: allUsers.filter((u) => u.primary_role === "ADMIN").length,
    manager: allUsers.filter((u) => u.primary_role === "MANAGER").length,
    coach: allUsers.filter((u) => u.primary_role === "COACH").length,
    member: allUsers.filter((u) => u.primary_role === "MEMBER").length,
  };

  const filtered = allUsers.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (u.full_name ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone ?? "").toLowerCase().includes(q) ||
      (u.employee_code ?? "").toLowerCase().includes(q);
    const matchRole = roleFilter === "ALL" || u.primary_role === roleFilter;
    const matchBranch = !branchFilter || u.branch_name === branchFilter;
    const matchStatus =
      !statusFilter ||
      (statusFilter === "ACTIVE" && u.status === "ACTIVE") ||
      (statusFilter === "INACTIVE" && u.status !== "ACTIVE");
    return matchSearch && matchRole && matchBranch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const branches = branchesQuery.data ?? [];
  const activeBranches = branches.filter((b) => b.status !== "CLOSED");

  function handleToggle(user: UserRow) {
    if (user.is_last_admin) return;
    if (user.status === "ACTIVE") {
      setDeactivateTarget({ id: user.id, name: user.full_name ?? user.email });
    } else {
      updateStatusMutation.mutate({ userId: user.id, status: "ACTIVE" });
    }
  }

  function confirmDeactivate() {
    if (!deactivateTarget) return;
    updateStatusMutation.mutate({ userId: deactivateTarget.id, status: "INACTIVE" });
    setDeactivateTarget(null);
  }

  function toggleBranchId(id: string) {
    setSoForm((prev) => ({
      ...prev,
      branch_ids: prev.branch_ids.includes(id)
        ? prev.branch_ids.filter((b) => b !== id)
        : [...prev.branch_ids, id],
    }));
  }

  function togglePermission(key: string) {
    setSoForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  }

  function handleDetailOpen(user: UserRow) {
    setDetailUser(user);
    setExpandedUserId(user.id);
    setAssignForm({ roleCode: "MEMBER", branchId: "" });
  }

  const isActive = (u: UserRow) => u.status === "ACTIVE";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5">
          <p style={{ color: "var(--gray-500)" }} className="text-[10px] uppercase tracking-wide mb-1 font-medium">Tổng</p>
          <p style={{ color: "var(--black)" }} className="text-2xl font-extrabold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-3.5" style={{ borderColor: "#FECDD3" }}>
          <p className="text-[10px] uppercase tracking-wide mb-1 font-semibold" style={{ color: "#FB7185" }}>Admin</p>
          <p style={{ color: "var(--black)" }} className="text-2xl font-extrabold">{stats.admin}</p>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-3.5" style={{ borderColor: "#E9D5FF" }}>
          <p className="text-[10px] uppercase tracking-wide mb-1 font-semibold" style={{ color: "#7C3AED" }}>Manager</p>
          <p style={{ color: "var(--black)" }} className="text-2xl font-extrabold">{stats.manager}</p>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-3.5" style={{ borderColor: "#A7F3D0" }}>
          <p className="text-[10px] uppercase tracking-wide mb-1 font-semibold" style={{ color: "#059669" }}>Coach</p>
          <p style={{ color: "var(--black)" }} className="text-2xl font-extrabold">{stats.coach}</p>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-3.5" style={{ borderColor: "var(--blush)" }}>
          <p className="text-[10px] uppercase tracking-wide mb-1 font-semibold" style={{ color: "var(--primary-pink)" }}>Member</p>
          <p style={{ color: "var(--black)" }} className="text-2xl font-extrabold">{stats.member}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--gray-500)" }} />
            <input
              type="text"
              placeholder="Tên, email, SĐT, mã nhân viên..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm transition-all focus:bg-white focus:outline-none"
              style={{ "--tw-ring-color": "var(--primary-pink)" } as React.CSSProperties}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary-pink)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "")}
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium mr-1" style={{ color: "var(--gray-500)" }}>Vai trò:</span>
            {ROLE_FILTER_CHIPS.map((chip) => {
              const isChipActive = roleFilter === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => { setRoleFilter(chip); setPage(1); }}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all"
                  style={
                    isChipActive
                      ? CHIP_ACTIVE_STYLE[chip]
                      : { borderColor: "#E5E7EB", color: "var(--gray-500)", background: "transparent" }
                  }
                >
                  {chip === "ALL" ? "Tất cả" : chip.charAt(0) + chip.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>

          <select
            value={branchFilter}
            onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm transition-all focus:outline-none"
            style={{ color: "var(--gray-500)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary-pink)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "")}
          >
            <option value="">Tất cả chi nhánh</option>
            {activeBranches.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm transition-all focus:outline-none"
            style={{ color: "var(--gray-500)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary-pink)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "")}
          >
            <option value="">Mọi trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Vô hiệu</option>
          </select>

          <button
            type="button"
            onClick={() => { setSlideOverOpen(true); setSoStep(1); }}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-white text-sm font-semibold flex-shrink-0 transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "linear-gradient(to right, var(--primary-pink), var(--deep-pink))",
              boxShadow: "0 4px 12px rgba(255,107,157,0.35)",
            }}
          >
            <Plus className="w-4 h-4" />
            Tạo nhân sự
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {usersQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2" style={{ color: "var(--gray-500)" }}>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Đang tải người dùng...</span>
          </div>
        ) : usersQuery.isError ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm" style={{ color: "var(--rose-error)" }}>Không tải được danh sách người dùng.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>Người dùng</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>Email</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>Vai trò</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>Chi nhánh</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>Trạng thái</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>Ngày tạo</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "var(--gray-500)" }}>
                        Không tìm thấy kết quả
                      </td>
                    </tr>
                  ) : (
                    paginated.map((user) => {
                      const role = user.primary_role ?? "GUEST";
                      const meta = ROLE_META[role] ?? ROLE_META.GUEST;
                      const initials = getInitials(user.full_name ?? user.email);
                      const active = isActive(user);
                      const isLastAdmin = !!user.is_last_admin;
                      return (
                        <tr
                          key={user.id}
                          className="border-b border-gray-50 transition-colors group"
                          style={{ }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,157,0.04)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0 border-2"
                                style={{ background: meta.avatarBg, borderColor: meta.avatarBg }}
                              >
                                {initials}
                              </div>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: "var(--black)" }}>{user.full_name ?? "—"}</p>
                                <p className="text-[11px]" style={{ color: "var(--gray-500)" }}>{user.employee_code ?? user.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs" style={{ color: "var(--gray-500)" }}>{user.email}</td>
                          <td className="px-3 py-3">
                            <span
                              className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                              style={{ background: meta.bg, borderColor: meta.border, color: meta.text }}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs" style={{ color: "var(--gray-500)" }}>{user.branch_name ?? "—"}</td>
                          <td className="px-3 py-3">
                            {isLastAdmin ? (
                              <div className="relative inline-block group/tip">
                                <button
                                  type="button"
                                  disabled
                                  className="flex items-center gap-1.5 opacity-40 cursor-not-allowed"
                                >
                                  <div className="w-9 h-5 rounded-full relative" style={{ background: "var(--primary-pink)" }}>
                                    <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow top-0.5 right-0.5" />
                                  </div>
                                  <Lock className="w-3.5 h-3.5" style={{ color: "var(--rose-error)" }} />
                                </button>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-black/80 text-white text-[10px] px-2 py-1 rounded-md pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity z-10">
                                  Không thể vô hiệu hóa admin cuối cùng
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggle(user)}
                                disabled={updateStatusMutation.isPending}
                                className="flex items-center"
                              >
                                <div
                                  className="w-9 h-5 rounded-full relative transition-colors"
                                  style={{ background: active ? "var(--primary-pink)" : "#E5E7EB" }}
                                >
                                  <div
                                    className="absolute w-3.5 h-3.5 bg-white rounded-full shadow top-0.5 transition-all"
                                    style={{ [active ? "right" : "left"]: "2px" }}
                                  />
                                </div>
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-3 text-xs" style={{ color: "var(--gray-500)" }}>{formatDate(user.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleDetailOpen(user)}
                                title="Chỉnh sửa"
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                style={{ color: "var(--gray-500)" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--lavender)"; e.currentTarget.style.color = "#7C3AED"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--gray-500)"; }}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setResetPwTarget({ id: user.id, name: user.full_name ?? user.email, email: user.email })}
                                title="Đặt lại mật khẩu"
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                style={{ color: "var(--gray-500)" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--lavender)"; e.currentTarget.style.color = "#7C3AED"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--gray-500)"; }}
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>
                              <div className="relative" ref={openMoreId === user.id ? moreRef : undefined}>
                                <button
                                  type="button"
                                  onClick={() => setOpenMoreId(openMoreId === user.id ? null : user.id)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                  style={{ color: "var(--gray-500)" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                                {openMoreId === user.id && (
                                  <div className="absolute right-0 top-8 bg-white border border-gray-100 shadow-lg rounded-xl py-1 z-10 w-36">
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-xs transition-colors"
                                      style={{ color: "var(--gray-500)" }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "var(--black)"; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--gray-500)"; }}
                                    >
                                      Xem lịch sử
                                    </button>
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-xs transition-colors"
                                      style={{ color: "var(--gray-500)" }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "var(--black)"; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--gray-500)"; }}
                                    >
                                      Xuất dữ liệu
                                    </button>
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-xs transition-colors"
                                      style={{ color: "var(--rose-error)" }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF1F2")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                                    >
                                      Xoá tài khoản
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs" style={{ color: "var(--gray-500)" }}>
                Hiển thị {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} người dùng
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center transition-colors disabled:opacity-40"
                  style={{ color: "var(--gray-500)" }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className="w-8 h-8 rounded-lg text-xs font-semibold transition-colors"
                      style={
                        page === p
                          ? { background: "var(--primary-pink)", color: "#fff" }
                          : { border: "1px solid #E5E7EB", color: "var(--gray-500)", background: "transparent" }
                      }
                      onMouseEnter={(e) => page !== p && (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => page !== p && (e.currentTarget.style.background = "transparent")}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center transition-colors disabled:opacity-40"
                  style={{ color: "var(--gray-500)" }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {slideOverOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => { setSlideOverOpen(false); setSoStep(1); }}
          />
          <div
            className="absolute top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col"
            style={{ animation: "slideInRight 0.3s cubic-bezier(0.32,0.72,0,1) both" }}
          >
            <style>{`@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--black)" }}>Tạo nhân sự mới</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--gray-500)" }}>Gửi email đặt mật khẩu sau khi tạo</p>
              </div>
              <button
                type="button"
                onClick={() => { setSlideOverOpen(false); setSoStep(1); }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors hover:bg-gray-200"
                style={{ color: "var(--gray-500)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center px-6 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={
                    soStep === 1
                      ? { background: "var(--primary-pink)", color: "#fff", boxShadow: "0 0 0 3px rgba(255,107,157,0.2)" }
                      : { background: "#059669", color: "#fff" }
                  }
                >
                  {soStep > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
                </div>
                <span className="text-[10px] font-medium" style={{ color: soStep === 1 ? "var(--primary-pink)" : "#059669" }}>Thông tin</span>
              </div>
              <div className="flex-1 h-0.5 mb-4 transition-colors" style={{ background: soStep > 1 ? "var(--primary-pink)" : "#E5E7EB" }} />
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={
                    soStep === 2
                      ? { background: "var(--primary-pink)", color: "#fff", boxShadow: "0 0 0 3px rgba(255,107,157,0.2)" }
                      : { background: "#F3F4F6", color: "var(--gray-500)" }
                  }
                >
                  2
                </div>
                <span className="text-[10px] font-medium" style={{ color: soStep === 2 ? "var(--primary-pink)" : "var(--gray-500)" }}>Phân quyền</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {soStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--black)" }}>
                        Email <span style={{ color: "var(--rose-error)" }}>*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="nhanvien@myfit.vn"
                        value={soForm.email}
                        onChange={(e) => setSoForm((f) => ({ ...f, email: e.target.value }))}
                        className="myfit-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--black)" }}>
                        Họ và tên <span style={{ color: "var(--rose-error)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={soForm.full_name}
                        onChange={(e) => setSoForm((f) => ({ ...f, full_name: e.target.value }))}
                        className="myfit-input w-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--black)" }}>Số điện thoại</label>
                      <div className="flex gap-2">
                        <div className="h-10 px-3 rounded-xl bg-gray-100 text-sm flex items-center flex-shrink-0" style={{ color: "var(--gray-500)" }}>+84</div>
                        <input
                          type="tel"
                          placeholder="912345678"
                          value={soForm.phone}
                          onChange={(e) => setSoForm((f) => ({ ...f, phone: e.target.value }))}
                          className="myfit-input flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--black)" }}>
                        Mã nhân viên <span style={{ color: "var(--rose-error)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="EMP-2026-001"
                        value={soForm.employee_code}
                        onChange={(e) => setSoForm((f) => ({ ...f, employee_code: e.target.value }))}
                        className="myfit-input w-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--black)" }}>
                        Vai trò <span style={{ color: "var(--rose-error)" }}>*</span>
                      </label>
                      <select
                        value={soForm.role}
                        onChange={(e) => setSoForm((f) => ({ ...f, role: e.target.value }))}
                        className="myfit-input w-full"
                      >
                        <option value="">-- Chọn vai trò --</option>
                        <option value="COACH">Coach</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--black)" }}>
                        Chi nhánh chính <span style={{ color: "var(--rose-error)" }}>*</span>
                      </label>
                      <select
                        value={soForm.branch_id}
                        onChange={(e) => setSoForm((f) => ({ ...f, branch_id: e.target.value }))}
                        className="myfit-input w-full"
                      >
                        <option value="">-- Chọn chi nhánh --</option>
                        {activeBranches.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--black)" }}>Chức danh</label>
                    <input
                      type="text"
                      placeholder="VD: Huấn luyện viên cá nhân, Quản lý vận hành..."
                      value={soForm.job_title}
                      onChange={(e) => setSoForm((f) => ({ ...f, job_title: e.target.value }))}
                      className="myfit-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--black)" }}>Ghi chú nội bộ</label>
                    <textarea
                      rows={3}
                      placeholder="Ghi chú dành cho admin..."
                      value={soForm.notes}
                      onChange={(e) => setSoForm((f) => ({ ...f, notes: e.target.value }))}
                      className="myfit-input w-full resize-none"
                      style={{ height: "auto", paddingTop: "10px", paddingBottom: "10px" }}
                    />
                  </div>
                </div>
              )}

              {soStep === 2 && (
                <div className="space-y-5">
                  {soForm.role === "MANAGER" && (
                    <div>
                      <p className="text-sm font-bold mb-2" style={{ color: "var(--black)" }}>Chi nhánh quản lý</p>
                      <div className="rounded-2xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="text-left px-3 py-2.5 text-xs font-semibold w-10" style={{ color: "var(--gray-500)" }}>
                                <input
                                  type="checkbox"
                                  className="w-3.5 h-3.5 accent-pink-400"
                                  checked={soForm.branch_ids.length === activeBranches.length && activeBranches.length > 0}
                                  onChange={(e) =>
                                    setSoForm((f) => ({ ...f, branch_ids: e.target.checked ? activeBranches.map((b) => b.id) : [] }))
                                  }
                                />
                              </th>
                              <th className="text-left px-3 py-2.5 text-xs font-semibold" style={{ color: "var(--gray-500)" }}>Chi nhánh</th>
                              <th className="text-left px-3 py-2.5 text-xs font-semibold" style={{ color: "var(--gray-500)" }}>Khu vực</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeBranches.map((b) => (
                              <tr key={b.id} className="border-b border-gray-50 last:border-0">
                                <td className="px-3 py-2.5">
                                  <input
                                    type="checkbox"
                                    className="w-3.5 h-3.5 accent-pink-400"
                                    checked={soForm.branch_ids.includes(b.id)}
                                    onChange={() => toggleBranchId(b.id)}
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-xs font-medium" style={{ color: "var(--black)" }}>{b.name}</td>
                                <td className="px-3 py-2.5 text-xs" style={{ color: "var(--gray-500)" }}>{b.region ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-bold mb-2" style={{ color: "var(--black)" }}>Quyền hạn</p>
                    <div className="space-y-2">
                      {PERMISSIONS.map((perm) => {
                        const checked = soForm.permissions.includes(perm.key);
                        return (
                          <label
                            key={perm.key}
                            className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                            style={{ background: "#F9FAFB", borderColor: "#F3F4F6" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--lavender)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 accent-pink-400"
                              checked={checked}
                              onChange={() => togglePermission(perm.key)}
                            />
                            <div>
                              <p className="text-xs font-semibold" style={{ color: "var(--black)" }}>{perm.label}</p>
                              <p className="text-[10px] mt-0.5" style={{ color: "var(--gray-500)" }}>{perm.desc}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex gap-3">
              {soStep === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => { setSlideOverOpen(false); setSoStep(1); }}
                    className="flex-1 h-11 rounded-2xl border border-gray-200 text-sm font-semibold transition-colors hover:bg-gray-50"
                    style={{ color: "var(--gray-500)" }}
                  >
                    Huỷ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSoStep(2)}
                    disabled={!soForm.email || !soForm.full_name || !soForm.role || !soForm.branch_id}
                    className="flex-1 h-11 rounded-2xl text-white text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={{ background: "linear-gradient(to right, var(--primary-pink), var(--deep-pink))" }}
                  >
                    Tiếp theo →
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSoStep(1)}
                    className="flex-1 h-11 rounded-2xl border border-gray-200 text-sm font-semibold transition-colors hover:bg-gray-50"
                    style={{ color: "var(--gray-500)" }}
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => createUserMutation.mutate(soForm)}
                    disabled={createUserMutation.isPending}
                    className="flex-1 h-11 rounded-2xl text-white text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: "linear-gradient(to right, var(--primary-pink), var(--deep-pink))" }}
                  >
                    {createUserMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tạo...</span>
                      </>
                    ) : (
                      "Tạo nhân sự"
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailUser(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: (ROLE_META[detailUser.primary_role ?? "GUEST"] ?? ROLE_META.GUEST).avatarBg }}
              >
                {getInitials(detailUser.full_name ?? detailUser.email)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold truncate" style={{ color: "var(--black)" }}>{detailUser.full_name ?? "—"}</p>
                <p className="text-xs" style={{ color: "var(--gray-500)" }}>{detailUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 flex-shrink-0"
                style={{ color: "var(--gray-500)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--black)" }}>Vai trò hiện tại</p>
                {rolesQuery.isLoading ? (
                  <div className="text-xs" style={{ color: "var(--gray-500)" }}>Đang tải...</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(rolesQuery.data ?? []).length === 0 && (
                      <span className="text-xs" style={{ color: "var(--gray-500)" }}>Chưa có role nào.</span>
                    )}
                    {(rolesQuery.data ?? []).map((r) => {
                      const rm = ROLE_META[r.roleCode] ?? ROLE_META.GUEST;
                      return (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border"
                          style={{ background: rm.bg, borderColor: rm.border, color: rm.text }}
                        >
                          {rm.label}
                          {r.branchId && <span className="font-normal opacity-70">@ {r.branchId.slice(0, 8)}</span>}
                          <button
                            type="button"
                            onClick={() => revokeRoleMutation.mutate({ userId: detailUser.id, roleCode: r.roleCode, branchId: r.branchId })}
                            disabled={revokeRoleMutation.isPending}
                            className="transition-colors hover:opacity-60"
                            aria-label="Gỡ role"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <select
                  value={assignForm.roleCode}
                  onChange={(e) => setAssignForm({ ...assignForm, roleCode: e.target.value })}
                  className="myfit-input flex-1"
                >
                  <option value="">Thêm vai trò...</option>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                  ))}
                </select>
                {assignForm.roleCode === "MANAGER" && (
                  <select
                    value={assignForm.branchId}
                    onChange={(e) => setAssignForm({ ...assignForm, branchId: e.target.value })}
                    className="myfit-input flex-1"
                  >
                    <option value="">Chọn chi nhánh...</option>
                    {activeBranches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() =>
                    assignRoleMutation.mutate({
                      userId: detailUser.id,
                      roleCode: assignForm.roleCode,
                      branchId: assignForm.roleCode === "MANAGER" ? assignForm.branchId : null,
                    })
                  }
                  disabled={
                    assignRoleMutation.isPending ||
                    !assignForm.roleCode ||
                    (assignForm.roleCode === "MANAGER" && !assignForm.branchId)
                  }
                  className="h-10 px-4 rounded-xl text-white text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ background: "linear-gradient(to right, var(--primary-pink), var(--deep-pink))" }}
                >
                  Gán
                </button>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--black)" }}>Chi nhánh quản lý</p>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-3 py-2 font-semibold w-10" style={{ color: "var(--gray-500)" }}>
                          <input type="checkbox" className="accent-pink-400" />
                        </th>
                        <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--gray-500)" }}>Chi nhánh</th>
                        <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--gray-500)" }}>Khu vực</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeBranches.map((b) => {
                        const assigned = (rolesQuery.data ?? []).some(
                          (r) => r.roleCode === "MANAGER" && r.branchId === b.id,
                        );
                        return (
                          <tr key={b.id} className="border-b border-gray-50 last:border-0">
                            <td className="px-3 py-2">
                              <input type="checkbox" className="accent-pink-400" checked={assigned} readOnly />
                            </td>
                            <td className="px-3 py-2 font-medium" style={{ color: "var(--black)" }}>{b.name}</td>
                            <td className="px-3 py-2" style={{ color: "var(--gray-500)" }}>{b.region ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setResetPwTarget({ id: detailUser.id, name: detailUser.full_name ?? detailUser.email, email: detailUser.email })}
                className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold transition-all hover:border-pink-400"
                style={{ color: "var(--gray-500)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary-pink)"; e.currentTarget.style.borderColor = "var(--primary-pink)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--gray-500)"; e.currentTarget.style.borderColor = ""; }}
              >
                <Key className="w-4 h-4" />
                Đặt lại mật khẩu
              </button>
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="ml-auto h-10 px-4 rounded-xl text-white text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(to right, var(--primary-pink), var(--deep-pink))" }}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeactivateTarget(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <AlertTriangle className="w-7 h-7" style={{ color: "var(--rose-error)" }} />
              </div>
              <h3 className="text-base font-bold mb-1" style={{ color: "var(--black)" }}>Vô hiệu hóa tài khoản?</h3>
              <p className="text-sm" style={{ color: "var(--gray-500)" }}>Tài khoản &ldquo;{deactivateTarget.name}&rdquo; sẽ bị khoá.</p>
            </div>
            <p
              className="text-xs rounded-xl p-3 mb-5 text-center border"
              style={{ color: "var(--gray-500)", background: "#FFF8F0", borderColor: "var(--peach)" }}
            >
              Tài khoản sẽ bị khóa ngay lập tức. Người dùng không thể đăng nhập cho đến khi được kích hoạt lại.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeactivateTarget(null)}
                className="flex-1 h-11 rounded-2xl border border-gray-200 text-sm font-semibold transition-colors hover:bg-gray-50"
                style={{ color: "var(--gray-500)" }}
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={confirmDeactivate}
                disabled={updateStatusMutation.isPending}
                className="flex-1 h-11 rounded-2xl text-white text-sm font-semibold transition-colors disabled:opacity-70"
                style={{ background: "var(--rose-error)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F43F5E")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--rose-error)")}
              >
                Vô hiệu hóa
              </button>
            </div>
          </div>
        </div>
      )}

      {resetPwTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setResetPwTarget(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: "var(--lavender)" }}>
                <Key className="w-7 h-7" style={{ color: "#7C3AED" }} />
              </div>
              <h3 className="text-base font-bold mb-1" style={{ color: "var(--black)" }}>Đặt lại mật khẩu</h3>
              <p className="text-sm" style={{ color: "var(--gray-500)" }}>
                Gửi email hướng dẫn đặt mật khẩu mới tới <strong>{resetPwTarget.email}</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setResetPwTarget(null)}
                className="flex-1 h-11 rounded-2xl border border-gray-200 text-sm font-semibold transition-colors hover:bg-gray-50"
                style={{ color: "var(--gray-500)" }}
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => resetPasswordMutation.mutate(resetPwTarget.id)}
                disabled={resetPasswordMutation.isPending}
                className="flex-1 h-11 rounded-2xl text-white text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(to right, #7C3AED, #9333EA)" }}
              >
                {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Gửi email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
