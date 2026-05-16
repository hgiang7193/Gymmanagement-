"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type StaffMember = {
  id: string;
  userId: string;
  staffRole: string;
  baseBranchId: string;
  isActive: boolean;
  fullName: string | null;
  phoneNumber: string | null;
  email: string;
};

const ROLE_COLORS: Record<string, string> = {
  COACH:        "bg-indigo-100 text-indigo-800",
  RECEPTIONIST: "bg-teal-100 text-teal-800",
  MANAGER:      "bg-amber-100 text-amber-800",
  ADMIN:        "bg-slate-100 text-slate-700",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[role] ?? "bg-slate-100 text-slate-700"}`}>
      {role}
    </span>
  );
}

export function ManagerStaffPanel() {
  const { authorizedRequest, session } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = session?.role === "ADMIN";
  const sessionBranchId = session?.branchIds?.[0] ?? "";
  const [adminBranchId, setAdminBranchId] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const branchesQuery = useQuery({
    queryKey: ["staff-branches"],
    queryFn: async () => (await authorizedRequest<{ id: string; name: string; code: string }[]>("/api/v1/branches")).data ?? [],
  });

  const branchId = isAdmin ? adminBranchId : sessionBranchId;

  const query = useQuery({
    queryKey: ["manager-staff", branchId, roleFilter, isAdmin],
    queryFn: async () => {
      // Nếu là ADMIN và đã chọn chi nhánh: lọc theo chi nhánh đó.
      // Nếu là ADMIN không chọn: lấy tất cả qua /admin/staff.
      // Nếu là MANAGER: lọc theo chi nhánh của họ.
      if (isAdmin && !branchId) {
        const res = await authorizedRequest<StaffMember[]>("/api/v1/admin/staff");
        const all = res.data ?? [];
        return roleFilter ? all.filter((s: StaffMember) => (s.staffRole ?? "").toUpperCase() === roleFilter) : all;
      }
      const params = new URLSearchParams({ branch_id: branchId });
      if (roleFilter) params.set("role", roleFilter);
      const res = await authorizedRequest<StaffMember[]>(`/api/v1/manager/staff?${params}`);
      return res.data ?? [];
    },
    enabled: isAdmin || !!branchId,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ staffId, isActive }: { staffId: string; isActive: boolean }) => {
      await authorizedRequest(`/api/v1/manager/staff/${staffId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      toast.success("Trạng thái nhân sự đã được cập nhật");
      queryClient.invalidateQueries({ queryKey: ["manager-staff"] });
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const staff = query.data ?? [];
  const active = staff.filter(s => s.isActive);
  const inactive = staff.filter(s => !s.isActive);

  if (!isAdmin && !branchId) {
    return (
      <AppShell role="MANAGER" title="Nhân sự" description="Quản lý coach và nhân viên chi nhánh.">
        <SurfaceCard title="Chưa có chi nhánh">
          <p className="text-sm text-slate-600">Tài khoản chưa được gán chi nhánh.</p>
        </SurfaceCard>
      </AppShell>
    );
  }

  return (
    <AppShell role="MANAGER" title="Nhân sự" description={isAdmin ? "Danh sách toàn bộ nhân sự, có thể lọc theo chi nhánh." : "Quản lý coach và nhân viên chi nhánh."}>
      <ScreenIntro eyebrow={isAdmin ? "Admin" : "Manager"} title="Danh sách nhân sự" body="Xem và quản lý trạng thái huấn luyện viên / nhân viên." />

      {isAdmin && (
        <div className="mb-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            Chi nhánh:
            <select
              value={adminBranchId}
              onChange={(e) => setAdminBranchId(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">Tất cả chi nhánh</option>
              {(branchesQuery.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-2">
        {["", "COACH", "RECEPTIONIST", "MANAGER"].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${roleFilter === r ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {r || "Tất cả"}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <p className="text-sm text-slate-500">Đang tải...</p>
      ) : query.isError ? (
        <p className="text-sm text-rose-600">Không tải được danh sách nhân sự.</p>
      ) : (
        <>
          <SurfaceCard
            title={`Đang hoạt động (${active.length})`}
            description="Nhân sự đang trong trạng thái active."
          >
            {active.length === 0 ? (
              <p className="text-sm text-slate-500">Không có nhân sự nào.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {active.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-800">{s.fullName ?? s.email}</p>
                      <p className="text-xs text-slate-400">{s.email}{s.phoneNumber ? ` · ${s.phoneNumber}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleBadge role={s.staffRole} />
                      <button
                        onClick={() => toggleMutation.mutate({ staffId: s.id, isActive: false })}
                        disabled={toggleMutation.isPending}
                        className="text-xs rounded-lg border border-rose-300 text-rose-600 px-2.5 py-1 hover:bg-rose-50 transition disabled:opacity-50"
                      >
                        Vô hiệu hoá
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>

          {inactive.length > 0 && (
            <SurfaceCard
              title={`Đã vô hiệu hoá (${inactive.length})`}
              description="Nhân sự không còn hoạt động."
            >
              <div className="divide-y divide-slate-100">
                {inactive.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-400 line-through">{s.fullName ?? s.email}</p>
                      <p className="text-xs text-slate-400">{s.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleBadge role={s.staffRole} />
                      <button
                        onClick={() => toggleMutation.mutate({ staffId: s.id, isActive: true })}
                        disabled={toggleMutation.isPending}
                        className="text-xs rounded-lg border border-emerald-300 text-emerald-600 px-2.5 py-1 hover:bg-emerald-50 transition disabled:opacity-50"
                      >
                        Kích hoạt lại
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}
        </>
      )}
    </AppShell>
  );
}
