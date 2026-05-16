"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type StaffMember = {
  id: string;
  user_id: string;
  staff_role: string;
  base_branch_id: string;
  is_active: boolean;
  full_name: string | null;
  phone_number: string | null;
  email: string;
};

const ROLE_COLORS: Record<string, string> = {
  COACH:        "bg-indigo-100 text-indigo-800",
  RECEPTIONIST: "bg-teal-100 text-teal-800",
  MANAGER:      "bg-amber-100 text-amber-800",
  ADMIN:        "bg-slate-100 text-slate-700",
};

function AllStaffList() {
  const { authorizedRequest } = useAuth();
  const query = useQuery({
    queryKey: ["admin-all-staff"],
    queryFn: async () => {
      const res = await authorizedRequest<StaffMember[]>("/api/v1/admin/staff");
      return res.data ?? [];
    },
  });

  if (query.isLoading) return <p className="text-sm text-slate-500">Đang tải...</p>;
  if (query.isError)   return <p className="text-sm text-rose-600">Không tải được danh sách nhân sự.</p>;
  const staff = query.data ?? [];

  return staff.length === 0 ? (
    <p className="text-sm text-slate-500">Chưa có hồ sơ nhân sự nào.</p>
  ) : (
    <div className="divide-y divide-slate-100">
      {staff.map(s => (
        <div key={s.id} className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-slate-800">{s.full_name ?? s.email}</p>
            <p className="text-xs text-slate-400">{s.email}{s.phone_number ? ` · ${s.phone_number}` : ""} · Branch: {s.base_branch_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[s.staff_role] ?? "bg-slate-100 text-slate-700"}`}>
              {s.staff_role}
            </span>
            {!s.is_active && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">Inactive</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminStaffPanel() {
  const { authorizedRequest } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail]               = useState("");
  const [fullName, setFullName]         = useState("");
  const [phoneNumber, setPhoneNumber]   = useState("");
  const [staffRole, setStaffRole]       = useState("COACH");
  const [branchId, setBranchId]         = useState("");
  const [employeeCode, setEmployeeCode] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await authorizedRequest("/api/v1/admin/staff", {
        method: "POST",
        body: JSON.stringify({ email, fullName, phoneNumber: phoneNumber || null, staffRole, branchId, employeeCode: employeeCode || null }),
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Đã tạo nhân sự. Email đặt mật khẩu lần đầu đã được gửi.");
      setEmail(""); setFullName(""); setPhoneNumber(""); setBranchId(""); setEmployeeCode("");
      queryClient.invalidateQueries({ queryKey: ["admin-all-staff"] });
    },
    onError: (err: Error) => {
      const map: Record<string, string> = {
        EMAIL_ALREADY_EXISTS: "Email đã được sử dụng",
        BRANCH_NOT_FOUND: "Không tìm thấy chi nhánh",
        INVALID_STAFF_ROLE: "Vai trò không hợp lệ",
        EMPLOYEE_CODE_ALREADY_EXISTS: "Mã nhân viên đã tồn tại",
      };
      toast.error(map[err.message] ?? err.message);
    },
  });

  return (
    <AppShell role="ADMIN" title="Nhân sự" description="Tạo tài khoản nhân viên mới (Coach, Receptionist, Manager).">
      <ScreenIntro eyebrow="Admin" title="Quản lý nhân sự" body="UC-ADMIN-05: Tạo tài khoản + hồ sơ nhân viên + gán role + gửi email đặt mật khẩu lần đầu." />

      <SurfaceCard title="Tất cả nhân sự" description="Danh sách hồ sơ nhân sự trong hệ thống.">
        <AllStaffList />
      </SurfaceCard>

      <SurfaceCard title="Đăng ký nhân sự mới" description="Hệ thống sẽ tạo tài khoản và gửi email đặt mật khẩu lần đầu.">
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Email *</span>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="staff@example.com"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Họ tên *</span>
              <input required value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Số điện thoại</span>
              <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Mã nhân viên</span>
              <input value={employeeCode} onChange={e => setEmployeeCode(e.target.value)}
                placeholder="Tự sinh nếu để trống"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Chi nhánh *</span>
              <input required value={branchId} onChange={e => setBranchId(e.target.value)}
                placeholder="ID chi nhánh cơ sở"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Vai trò *</span>
              <select value={staffRole} onChange={e => setStaffRole(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white">
                <option value="COACH">Huấn luyện viên</option>
                <option value="RECEPTIONIST">Lễ tân</option>
                <option value="MANAGER">Quản lý chi nhánh</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={mutation.isPending}
            className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400 transition">
            {mutation.isPending ? "Đang tạo..." : "Đăng ký nhân sự"}
          </button>
        </form>
      </SurfaceCard>
    </AppShell>
  );
}
