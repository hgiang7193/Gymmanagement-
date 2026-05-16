"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

type Branch = {
  id: string;
  code: string;
  name: string;
};

type MembershipPlan = {
  id: string;
  code: string;
  name: string;
};

type ActivationForm = {
  userId: string;
  membershipPlanId: string;
  homeBranchId: string;
  activatedAt: string;
};

const initialForm: ActivationForm = {
  userId: "",
  membershipPlanId: "",
  homeBranchId: "",
  activatedAt: "",
};

const selectClass =
  "h-[52px] w-full rounded-xl border-2 border-[var(--gray-100)] bg-white px-4 text-sm text-[var(--black)] outline-none focus:border-[var(--primary-pink)] focus:shadow-[0_0_0_4px_rgba(255,107,157,0.15)] disabled:opacity-50 disabled:cursor-not-allowed";

export function ManagerMembershipsPanel() {
  const { authorizedRequest, session } = useAuth();
  const [form, setForm] = useState<ActivationForm>(initialForm);

  const branchesQuery = useQuery({
    queryKey: ["manager-branches-for-activation"],
    queryFn: async () => {
      const response = await authorizedRequest<Branch[]>("/api/v1/manager/branches");
      return response.data;
    },
  });

  const plansQuery = useQuery({
    queryKey: ["membership-plans-for-activation"],
    queryFn: async () => {
      const response = await authorizedRequest<MembershipPlan[]>("/api/v1/membership-plans");
      return response.data;
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (payload: ActivationForm) => {
      const response = await authorizedRequest<{
        id: string;
        userId: string;
        membershipPlanId: string;
        homeBranchId: string;
        status: string;
      }>("/api/v1/manager/memberships/activate", {
        method: "POST",
        body: JSON.stringify({
          userId: payload.userId,
          membershipPlanId: payload.membershipPlanId,
          homeBranchId: payload.homeBranchId,
          activatedAt: payload.activatedAt || null,
        }),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Kích hoạt gói tập thành công");
      setForm(initialForm);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Kích hoạt gói tập thất bại";
      toast.error(message);
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    activateMutation.mutate(form);
  }

  const noManagedBranch =
    !branchesQuery.isLoading && (branchesQuery.data ?? []).length === 0;

  return (
    <div className="space-y-6">
      {/* Gradient header banner */}
      <div className="flex h-20 items-center gap-4 rounded-3xl bg-gradient-to-r from-violet-600 to-purple-500 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
          <Award className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">Kích hoạt gói tập</h1>
      </div>

      <SurfaceCard
        title="Thông tin kích hoạt"
        description="Điền đầy đủ thông tin bên dưới để kích hoạt gói tập cho hội viên."
      >
        {/* Warning: no managed branches */}
        {noManagedBranch && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <span className="mt-0.5 text-amber-500">⚠</span>
            <p className="text-sm text-amber-800">
              {session?.role === "ADMIN"
                ? "Tài khoản ADMIN chưa được gán chi nhánh quản lý nên danh sách chi nhánh đang trống. Hãy đăng nhập bằng tài khoản MANAGER (ví dụ: mgr.hn@myfit.vn) để thao tác theo dữ liệu seed."
                : "Tài khoản hiện tại chưa được gán chi nhánh quản lý nên danh sách chi nhánh đang trống."}
            </p>
          </div>
        )}

        <form className="grid gap-4 xl:grid-cols-2" onSubmit={onSubmit}>
          {/* userId */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--black)]">
              Mã hội viên (User ID) <span className="text-[var(--primary-pink)]">*</span>
            </label>
            <input
              required
              value={form.userId}
              onChange={(e) => setForm((c) => ({ ...c, userId: e.target.value }))}
              className="myfit-input"
              placeholder="Nhập User ID của hội viên..."
            />
          </div>

          {/* membershipPlanId */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--black)]">
              Gói tập <span className="text-[var(--primary-pink)]">*</span>
            </label>
            <select
              required
              value={form.membershipPlanId}
              onChange={(e) => setForm((c) => ({ ...c, membershipPlanId: e.target.value }))}
              disabled={plansQuery.isLoading}
              className={selectClass}
            >
              <option value="">
                {plansQuery.isLoading ? "Đang tải gói tập..." : "Chọn gói tập"}
              </option>
              {(plansQuery.data ?? []).map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.code})
                </option>
              ))}
            </select>
          </div>

          {/* homeBranchId */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--black)]">
              Chi nhánh chủ quản <span className="text-[var(--primary-pink)]">*</span>
            </label>
            <select
              required
              value={form.homeBranchId}
              onChange={(e) => setForm((c) => ({ ...c, homeBranchId: e.target.value }))}
              disabled={branchesQuery.isLoading}
              className={selectClass}
            >
              <option value="">
                {branchesQuery.isLoading ? "Đang tải chi nhánh..." : "Chọn chi nhánh"}
              </option>
              {(branchesQuery.data ?? []).map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
          </div>

          {/* activatedAt */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--black)]">
              Thời điểm kích hoạt (tuỳ chọn)
            </label>
            <input
              type="datetime-local"
              value={form.activatedAt}
              onChange={(e) => setForm((c) => ({ ...c, activatedAt: e.target.value }))}
              className="myfit-input"
            />
          </div>

          {/* Submit */}
          <div className="xl:col-span-2 pt-2">
            <button
              type="submit"
              disabled={activateMutation.isPending}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {activateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang kích hoạt...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4" />
                  Kích hoạt gói tập
                </>
              )}
            </button>
          </div>
        </form>
      </SurfaceCard>
    </div>
  );
}
