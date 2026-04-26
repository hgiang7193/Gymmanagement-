"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
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

export function ManagerMembershipsPanel() {
  const { authorizedRequest } = useAuth();
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
      toast.success("Kich hoat membership thanh cong");
      setForm(initialForm);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Kich hoat membership that bai";
      toast.error(message);
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    activateMutation.mutate(form);
  }

  return (
    <SurfaceCard title="Activate membership" description="Flow MVP cho manager kich hoat membership bang userId + plan + branch.">
      <form className="grid gap-4 xl:grid-cols-2" onSubmit={onSubmit}>
        <input value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3" placeholder="User ID" />
        <select value={form.membershipPlanId} onChange={(event) => setForm((current) => ({ ...current, membershipPlanId: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3">
          <option value="">Chon membership plan</option>
          {(plansQuery.data ?? []).map((plan) => (
            <option key={plan.id} value={plan.id}>{plan.name} ({plan.code})</option>
          ))}
        </select>
        <select value={form.homeBranchId} onChange={(event) => setForm((current) => ({ ...current, homeBranchId: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3">
          <option value="">Chon home branch</option>
          {(branchesQuery.data ?? []).map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>
          ))}
        </select>
        <input value={form.activatedAt} onChange={(event) => setForm((current) => ({ ...current, activatedAt: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3" placeholder="Activated at ISO (optional)" />
        <div className="xl:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={activateMutation.isPending} className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:bg-slate-400">
            {activateMutation.isPending ? "Dang kich hoat..." : "Kich hoat membership"}
          </button>
          <p className="text-sm text-slate-500">Tam thoi dung `userId` truc tiep vi backend chua co endpoint manager-search-member rieng.</p>
        </div>
      </form>
    </SurfaceCard>
  );
}
