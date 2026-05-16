"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

type TrialBooking = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  branchId: string;
  trialPlanName: string;
  scheduledAt: string;
  status: string;
  notes: string | null;
};

type MembershipPlan = {
  id: string;
  code: string;
  name: string;
  price: number;
  durationDays: number;
  totalSessions: number;
  isActive: boolean;
};

const trialStatuses = ["BOOKED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];

const statusBadgeClass: Record<string, string> = {
  BOOKED: "bg-blue-50 text-blue-700 border border-blue-200",
  CONFIRMED: "bg-violet-50 text-violet-700 border border-violet-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-600 border border-slate-200",
  NO_SHOW: "bg-rose-50 text-rose-700 border border-rose-200",
};

const statusLabel: Record<string, string> = {
  BOOKED: "Đã đặt",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
  NO_SHOW: "Vắng mặt",
  CONVERTED: "Đã chuyển đổi",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusBadgeClass[status] ?? "bg-slate-100 text-slate-600 border border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {statusLabel[status] ?? status}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ManagerTrialsPanel() {
  const queryClient = useQueryClient();
  const { authorizedRequest } = useAuth();
  const [convertDraft, setConvertDraft] = useState<Record<string, { membershipPlanId: string; activationNotes: string; paymentConfirmationRef: string }>>({});

  const trialsQuery = useQuery({
    queryKey: ["manager-trials"],
    queryFn: async () => {
      const response = await authorizedRequest<TrialBooking[]>("/api/v1/manager/trials");
      return response.data;
    },
  });

  const plansQuery = useQuery({
    queryKey: ["membership-plans-for-manager"],
    queryFn: async () => {
      const response = await authorizedRequest<MembershipPlan[]>("/api/v1/membership-plans");
      return response.data;
    },
  });

  const activePlans = useMemo(() => plansQuery.data ?? [], [plansQuery.data]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ trialBookingId, status }: { trialBookingId: string; status: string }) => {
      const response = await authorizedRequest<TrialBooking>(`/api/v1/manager/trials/${trialBookingId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Cập nhật trạng thái tập thử thành công");
      void queryClient.invalidateQueries({ queryKey: ["manager-trials"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Cập nhật trạng thái thất bại";
      toast.error(message);
    },
  });

  const convertMutation = useMutation({
    mutationFn: async ({ trial }: { trial: TrialBooking }) => {
      const draft = convertDraft[trial.id];
      const response = await authorizedRequest<{
        trialBookingId: string;
        subscriptionId: string;
        userId: string;
        membershipPlanId: string;
        homeBranchId: string;
        role: string;
        status: string;
      }>(`/api/v1/manager/trials/${trial.id}/convert`, {
        method: "POST",
        body: JSON.stringify({
          membershipPlanId: draft?.membershipPlanId,
          homeBranchId: trial.branchId,
          activationNotes: draft?.activationNotes || null,
          paymentConfirmationRef: draft?.paymentConfirmationRef || null,
        }),
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Chuyển đổi thành hội viên thành công");
      setConvertDraft((current) => ({
        ...current,
        [variables.trial.id]: { membershipPlanId: "", activationNotes: "", paymentConfirmationRef: "" },
      }));
      void queryClient.invalidateQueries({ queryKey: ["manager-trials"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Chuyển đổi thất bại";
      toast.error(message);
    },
  });

  function updateDraft(trialId: string, patch: Partial<{ membershipPlanId: string; activationNotes: string; paymentConfirmationRef: string }>) {
    setConvertDraft((current) => ({
      ...current,
      [trialId]: {
        membershipPlanId: current[trialId]?.membershipPlanId || "",
        activationNotes: current[trialId]?.activationNotes || "",
        paymentConfirmationRef: current[trialId]?.paymentConfirmationRef || "",
        ...patch,
      },
    }));
  }

  if (trialsQuery.isLoading) {
    return <p className="text-sm text-slate-600">Đang tải lịch tập thử...</p>;
  }

  if (trialsQuery.isError) {
    return <p className="text-sm text-rose-600">Không tải được lịch tập thử.</p>;
  }

  const trials = trialsQuery.data ?? [];

  if (!trials.length) {
    return <p className="text-sm text-slate-600">Hiện chưa có lịch tập thử nào.</p>;
  }

  return (
    <div className="space-y-4">
      {trials.map((trial) => {
        const draft = convertDraft[trial.id] ?? { membershipPlanId: "", activationNotes: "", paymentConfirmationRef: "" };
        const canConvert = trial.status !== "CONVERTED";

        return (
          <SurfaceCard
            key={trial.id}
            title={trial.fullName}
            description={`${trial.trialPlanName} · ${formatDate(trial.scheduledAt)}`}
          >
            <div className="space-y-5">
              {/* Current status badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái hiện tại:</span>
                <StatusBadge status={trial.status} />
              </div>

              <dl className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-medium text-slate-950">{trial.email}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Điện thoại</dt>
                  <dd className="font-medium text-slate-950">{trial.phoneNumber}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-slate-500">Ghi chú</dt>
                  <dd>{trial.notes || "Không có ghi chú"}</dd>
                </div>
              </dl>

              {/* Status update */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cập nhật trạng thái</div>
                <div className="flex flex-wrap gap-2">
                  {trialStatuses.map((status) => {
                    const isActive = trial.status === status;
                    const cls = statusBadgeClass[status] ?? "bg-slate-100 text-slate-600 border border-slate-200";
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateStatusMutation.mutate({ trialBookingId: trial.id, status })}
                        disabled={updateStatusMutation.isPending}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all disabled:opacity-50 ${
                          isActive
                            ? `${cls} ring-2 ring-offset-1 ring-current opacity-100`
                            : `${cls} opacity-60 hover:opacity-100`
                        }`}
                      >
                        {statusLabel[status] ?? status}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Convert form */}
              <form
                className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 space-y-3"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  convertMutation.mutate({ trial });
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  <span className="text-sm font-semibold text-violet-800">Chuyển đổi thành hội viên</span>
                </div>

                <select
                  value={draft.membershipPlanId}
                  onChange={(event) => updateDraft(trial.id, { membershipPlanId: event.target.value })}
                  className="myfit-input w-full"
                >
                  <option value="">
                    {plansQuery.isLoading ? "Đang tải gói tập..." : "Chọn gói tập"}
                  </option>
                  {activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.code})
                    </option>
                  ))}
                </select>

                <input
                  value={draft.activationNotes}
                  onChange={(event) => updateDraft(trial.id, { activationNotes: event.target.value })}
                  className="myfit-input w-full"
                  placeholder="Ghi chú kích hoạt (tuỳ chọn)"
                />
                <input
                  value={draft.paymentConfirmationRef}
                  onChange={(event) => updateDraft(trial.id, { paymentConfirmationRef: event.target.value })}
                  className="myfit-input w-full"
                  placeholder="Mã xác nhận thanh toán (tuỳ chọn)"
                />

                <button
                  type="submit"
                  disabled={!canConvert || convertMutation.isPending || !draft.membershipPlanId}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-2xl h-12 px-4 w-full transition-opacity disabled:opacity-40"
                >
                  {convertMutation.isPending ? "Đang xử lý..." : canConvert ? "Chuyển thành hội viên" : "Đã chuyển đổi"}
                </button>
              </form>
            </div>
          </SurfaceCard>
        );
      })}
    </div>
  );
}
