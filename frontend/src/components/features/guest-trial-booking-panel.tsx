"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

type Branch = { id: string; code: string; name: string; address: string };

const ERROR_MESSAGES: Record<string, string> = {
  SUBSCRIPTION_CONFLICT: "Bạn đã có gói/lịch trial active. Hãy theo dõi tại 'Lịch tập thử của tôi'.",
  BRANCH_NOT_FOUND: "Chi nhánh không tồn tại.",
  BRANCH_ID_REQUIRED: "Vui lòng chọn chi nhánh.",
  TRIAL_PLAN_NAME_REQUIRED: "Vui lòng nhập gói tập thử.",
  SCHEDULED_AT_REQUIRED: "Vui lòng chọn ngày giờ.",
  PHONE_NUMBER_REQUIRED: "Vui lòng nhập số điện thoại.",
  SCHEDULED_AT_IN_PAST: "Không thể đặt lịch trong quá khứ.",
};

function humanError(error: unknown) {
  const code = error instanceof Error ? error.message : String(error);
  return ERROR_MESSAGES[code] ?? code;
}

export function GuestTrialBookingPanel() {
  const queryClient = useQueryClient();
  const { authorizedRequest } = useAuth();
  const [form, setForm] = useState({
    branchId: "",
    trialPlanName: "Tập thử 1 buổi",
    scheduledAt: "",
    phoneNumber: "",
    notes: "",
  });

  const branchesQuery = useQuery({
    queryKey: ["public-branches"],
    queryFn: async () => (await authorizedRequest<Branch[]>("/api/v1/branches")).data,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      if (new Date(payload.scheduledAt).getTime() < Date.now()) {
        throw new Error("SCHEDULED_AT_IN_PAST");
      }
      const response = await authorizedRequest("/api/v1/trials", {
        method: "POST",
        body: JSON.stringify({
          branchId: payload.branchId,
          trialPlanName: payload.trialPlanName,
          scheduledAt: new Date(payload.scheduledAt).toISOString(),
          phoneNumber: payload.phoneNumber,
          notes: payload.notes || null,
        }),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Đã đặt lịch tập thử. Mời theo dõi trạng thái.");
      void queryClient.invalidateQueries({ queryKey: ["my-trials"] });
      setForm((current) => ({ ...current, scheduledAt: "", notes: "" }));
    },
    onError: (error) => toast.error(humanError(error)),
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.branchId || !form.scheduledAt || !form.phoneNumber) {
      toast.error("Vui lòng điền đầy đủ chi nhánh, thời gian và số điện thoại.");
      return;
    }
    createMutation.mutate(form);
  }

  return (
    <SurfaceCard title="Đặt lịch tập thử miễn phí" description="Chọn chi nhánh và khung giờ để trải nghiệm dịch vụ.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Chi nhánh</label>
          <select
            value={form.branchId}
            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">-- Chọn chi nhánh --</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.code}) — {b.address}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Gói tập thử</label>
          <input
            value={form.trialPlanName}
            onChange={(e) => setForm({ ...form, trialPlanName: e.target.value })}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Ngày giờ tập thử</label>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Số điện thoại</label>
          <input
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3"
            placeholder="0900000000"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Ghi chú (tuỳ chọn)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3"
            placeholder="Mục tiêu, tình trạng sức khoẻ..."
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-2xl bg-amber-600 px-5 py-3 font-semibold text-white disabled:bg-amber-300"
          >
            {createMutation.isPending ? "Đang đặt..." : "Đặt lịch ngay"}
          </button>
          <Link href="/me/trials" className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">
            Theo dõi lịch của tôi
          </Link>
        </div>
      </form>
    </SurfaceCard>
  );
}
