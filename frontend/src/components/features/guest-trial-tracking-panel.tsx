"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

type TrialBooking = {
  id: string;
  branchId: string;
  trialPlanName: string;
  scheduledAt: string;
  status: string;
  notes: string | null;
  convertedAt: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  BOOKED:    { label: "Đã đặt",     color: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Đã xác nhận",color: "bg-sky-100 text-sky-800" },
  ATTENDED:  { label: "Đã tham gia",color: "bg-emerald-100 text-emerald-800" },
  NO_SHOW:   { label: "Vắng mặt",   color: "bg-rose-100 text-rose-800" },
  CONVERTED: { label: "Đã chuyển đổi", color: "bg-violet-100 text-violet-800" },
  CANCELLED: { label: "Đã huỷ",     color: "bg-slate-200 text-slate-700" },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function GuestTrialTrackingPanel() {
  const { authorizedRequest } = useAuth();
  const trialsQuery = useQuery({
    queryKey: ["my-trials"],
    queryFn: async () => (await authorizedRequest<TrialBooking[]>("/api/v1/me/trials")).data,
  });

  if (trialsQuery.isLoading) {
    return <p className="text-sm text-slate-600">Đang tải lịch tập thử...</p>;
  }
  if (trialsQuery.isError) {
    return <p className="text-sm text-rose-600">Không tải được lịch tập thử.</p>;
  }

  const trials = trialsQuery.data ?? [];
  if (trials.length === 0) {
    return (
      <SurfaceCard title="Chưa có lịch tập thử" description="Đặt một buổi để trải nghiệm dịch vụ.">
        <Link href="/trials/book" className="inline-block rounded-2xl bg-amber-600 px-5 py-3 font-semibold text-white">
          Đặt lịch tập thử ngay
        </Link>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      {trials.map((trial) => {
        const status = STATUS_LABEL[trial.status] ?? { label: trial.status, color: "bg-slate-100 text-slate-700" };
        return (
          <SurfaceCard
            key={trial.id}
            title={trial.trialPlanName}
            description={`Mã booking: ${trial.id.slice(0, 12)}...`}
          >
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>{status.label}</span>
              <span>📅 {formatDate(trial.scheduledAt)}</span>
              <span>🏢 Chi nhánh: {trial.branchId.slice(0, 8)}</span>
            </div>
            {trial.notes ? <p className="mt-3 text-sm text-slate-600">Ghi chú: {trial.notes}</p> : null}
            {trial.convertedAt ? (
              <p className="mt-3 text-sm font-medium text-violet-700">
                Đã chuyển đổi thành member vào {formatDate(trial.convertedAt)}.
              </p>
            ) : null}
          </SurfaceCard>
        );
      })}
    </div>
  );
}
