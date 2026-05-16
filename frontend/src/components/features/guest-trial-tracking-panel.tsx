"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, MapPin, Sparkles, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";

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
  BOOKED:    { label: "Đã đặt",         color: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Đã xác nhận",    color: "bg-sky-100 text-sky-800" },
  ATTENDED:  { label: "Đã tham gia",    color: "bg-emerald-100 text-emerald-800" },
  NO_SHOW:   { label: "Vắng mặt",       color: "bg-rose-100 text-rose-800" },
  CONVERTED: { label: "Đã chuyển đổi",  color: "bg-violet-100 text-violet-800" },
  CANCELLED: { label: "Đã huỷ",         color: "bg-slate-200 text-slate-700" },
};

type TimelineStage = {
  key: string;
  label: string;
  description: string;
};

const TIMELINE_STAGES: TimelineStage[] = [
  { key: "BOOKED",    label: "Đã đăng ký",    description: "Lịch tập thử đã được ghi nhận" },
  { key: "CONFIRMED", label: "Đang xác nhận", description: "Nhân viên đang liên hệ xác nhận" },
  { key: "ATTENDED",  label: "Đã tập",        description: "Buổi tập thử đã hoàn thành" },
  { key: "CONVERTED", label: "Đã chuyển đổi", description: "Trở thành hội viên chính thức" },
];

function getStageIndex(status: string) {
  const order = ["BOOKED", "CONFIRMED", "ATTENDED", "CONVERTED"];
  const idx = order.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
}

function TrialTimeline({ status }: { status: string }) {
  const activeIdx = getStageIndex(status);
  return (
    <div className="mt-4 space-y-0">
      {TIMELINE_STAGES.map((stage, idx) => {
        const done = idx < activeIdx;
        const active = idx === activeIdx;
        const future = idx > activeIdx;
        return (
          <div key={stage.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all"
                style={
                  done
                    ? { background: "#059669", color: "#fff" }
                    : active
                      ? {
                          background: "var(--primary-pink)",
                          color: "#fff",
                          boxShadow: "0 0 0 4px rgba(255,107,157,0.2)",
                        }
                      : { background: "var(--gray-100)", color: "var(--gray-300)" }
                }
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : active ? (
                  <span className="relative flex h-3 w-3">
                    <span
                      className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                      style={{ background: "rgba(255,255,255,0.6)" }}
                    />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-[var(--gray-300)]" />
                )}
              </span>
              {idx < TIMELINE_STAGES.length - 1 ? (
                <div
                  className="w-0.5 flex-1 py-1"
                  style={{
                    background: done ? "#059669" : "var(--gray-100)",
                    minHeight: "28px",
                  }}
                />
              ) : null}
            </div>
            <div className="pb-6 pt-1">
              <p
                className="text-sm font-bold"
                style={{
                  color: done ? "#059669" : active ? "var(--primary-pink)" : "var(--gray-300)",
                }}
              >
                {stage.label}
              </p>
              <p
                className="mt-0.5 text-xs"
                style={{ color: future ? "var(--gray-300)" : "var(--gray-500)" }}
              >
                {stage.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function GuestTrialTrackingPanel() {
  const { authorizedRequest } = useAuth();
  const trialsQuery = useQuery({
    queryKey: ["my-trials"],
    queryFn: async () => (await authorizedRequest<TrialBooking[]>("/api/v1/me/trials")).data,
  });

  if (trialsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--gray-300)] border-t-[var(--primary-pink)]" />
      </div>
    );
  }

  if (trialsQuery.isError) {
    return (
      <div
        className="rounded-2xl border-2 p-6 text-center"
        style={{ borderColor: "var(--rose-error)", background: "#fff5f5" }}
      >
        <p className="text-sm font-semibold text-[var(--rose-error)]">Không tải được lịch tập thử.</p>
      </div>
    );
  }

  const trials = trialsQuery.data ?? [];

  if (trials.length === 0) {
    return (
      <div
        className="myfit-surface rounded-3xl p-8 text-center"
        style={{ borderColor: "var(--blush)" }}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "var(--pastel-pink)" }}
        >
          <Sparkles className="h-8 w-8 text-[var(--primary-pink)]" />
        </div>
        <h3 className="text-lg font-bold text-[var(--black)]">Chưa có lịch tập thử</h3>
        <p className="mt-1 text-sm text-[var(--gray-500)]">
          Đặt một buổi tập thử miễn phí để trải nghiệm dịch vụ.
        </p>
        <Link
          href="/trials/book"
          className="myfit-btn-primary mt-6 inline-flex h-12 items-center justify-center rounded-2xl px-8 text-sm font-bold"
        >
          Đặt lịch tập thử ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {trials.map((trial) => {
        const status = STATUS_LABEL[trial.status] ?? { label: trial.status, color: "bg-slate-100 text-slate-700" };
        return (
          <div
            key={trial.id}
            className="myfit-surface overflow-hidden rounded-3xl"
            style={{ borderColor: "var(--blush)" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ background: "var(--pastel-pink)" }}
            >
              <div>
                <p className="font-bold text-[var(--black)]">{trial.trialPlanName}</p>
                <p className="mt-0.5 text-xs text-[var(--gray-500)]">
                  #{trial.id.slice(0, 12).toUpperCase()}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.color}`}>
                {status.label}
              </span>
            </div>

            <div className="px-6 py-5">
              <div className="mb-5 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-[var(--gray-500)]">
                  <CalendarDays className="h-4 w-4 text-[var(--primary-pink)]" />
                  <span>{formatDate(trial.scheduledAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--gray-500)]">
                  <MapPin className="h-4 w-4 text-[var(--primary-pink)]" />
                  <span>Chi nhánh {trial.branchId.slice(0, 8)}</span>
                </div>
              </div>

              {trial.notes ? (
                <div
                  className="mb-5 rounded-xl px-4 py-3 text-sm text-[var(--gray-500)]"
                  style={{ background: "var(--gray-100)" }}
                >
                  {trial.notes}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--gray-500)]">
                    Tiến trình
                  </p>
                  <TrialTimeline status={trial.status} />
                </div>

                {trial.convertedAt ? (
                  <div
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl p-5 text-center"
                    style={{ background: "var(--mint)" }}
                  >
                    <UserCheck className="h-10 w-10 text-[#059669]" />
                    <div>
                      <p className="font-bold text-[#059669]">Đã trở thành hội viên</p>
                      <p className="mt-1 text-xs text-[#059669]/80">
                        Chuyển đổi {formatDate(trial.convertedAt)}
                      </p>
                    </div>
                  </div>
                ) : trial.status === "CONFIRMED" ? (
                  <div
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl p-5 text-center"
                    style={{ background: "var(--pastel-pink)" }}
                  >
                    <Clock className="h-10 w-10 text-[var(--primary-pink)]" />
                    <div>
                      <p className="font-bold text-[var(--primary-pink)]">Đã được xác nhận</p>
                      <p className="mt-1 text-xs text-[var(--gray-500)]">
                        Hẹn gặp bạn tại phòng tập!
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
