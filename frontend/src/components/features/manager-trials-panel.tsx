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
      toast.success("Cap nhat trial status thanh cong");
      void queryClient.invalidateQueries({ queryKey: ["manager-trials"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Cap nhat trial status that bai";
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
      toast.success("Convert trial thanh member thanh cong");
      setConvertDraft((current) => ({
        ...current,
        [variables.trial.id]: { membershipPlanId: "", activationNotes: "", paymentConfirmationRef: "" },
      }));
      void queryClient.invalidateQueries({ queryKey: ["manager-trials"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Convert trial that bai";
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
    return <p className="text-sm text-slate-600">Dang tai trial bookings...</p>;
  }

  if (trialsQuery.isError) {
    return <p className="text-sm text-rose-600">Khong tai duoc trial bookings cho manager.</p>;
  }

  const trials = trialsQuery.data ?? [];

  if (!trials.length) {
    return <p className="text-sm text-slate-600">Hien chua co trial nao trong branch scope cua manager.</p>;
  }

  return (
    <div className="space-y-4">
      {trials.map((trial) => {
        const draft = convertDraft[trial.id] ?? { membershipPlanId: "", activationNotes: "", paymentConfirmationRef: "" };
        const canConvert = trial.status !== "CONVERTED";

        return (
          <SurfaceCard key={trial.id} title={trial.fullName} description={`${trial.trialPlanName} - ${formatDate(trial.scheduledAt)}`}>
            <div className="space-y-4">
              <dl className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-medium text-slate-950">{trial.email}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="font-medium text-slate-950">{trial.phoneNumber}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Branch ID</dt>
                  <dd className="font-medium text-slate-950">{trial.branchId}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-medium text-slate-950">{trial.status}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-slate-500">Notes</dt>
                  <dd>{trial.notes || "Khong co ghi chu"}</dd>
                </div>
              </dl>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-900">Update status</div>
                <div className="flex flex-wrap gap-2">
                  {trialStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ trialBookingId: trial.id, status })}
                      disabled={updateStatusMutation.isPending}
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-800 transition hover:border-amber-400 hover:bg-amber-50 disabled:opacity-50"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <form
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  convertMutation.mutate({ trial });
                }}
              >
                <div className="text-sm font-semibold text-slate-900">Convert trial</div>
                <select value={draft.membershipPlanId} onChange={(event) => updateDraft(trial.id, { membershipPlanId: event.target.value })} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                  <option value="">Chon membership plan</option>
                  {activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} ({plan.code})</option>
                  ))}
                </select>
                <input value={draft.activationNotes} onChange={(event) => updateDraft(trial.id, { activationNotes: event.target.value })} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" placeholder="Activation notes (optional)" />
                <input value={draft.paymentConfirmationRef} onChange={(event) => updateDraft(trial.id, { paymentConfirmationRef: event.target.value })} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" placeholder="Payment confirmation ref (optional)" />
                <button type="submit" disabled={!canConvert || convertMutation.isPending || !draft.membershipPlanId} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-400">
                  {convertMutation.isPending ? "Dang convert..." : canConvert ? "Convert thanh member" : "Da convert"}
                </button>
              </form>
            </div>
          </SurfaceCard>
        );
      })}
    </div>
  );
}
