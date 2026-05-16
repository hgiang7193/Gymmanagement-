"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Dumbbell, Calendar, MapPin, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

type Subscription = {
  id: string;
  membershipPlanId: string;
  homeBranchId: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  totalSessions: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  activatedAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}

function daysRemaining(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold tracking-wide",
        isActive
          ? "bg-white text-green-600"
          : "bg-red-100 text-red-700",
      ].join(" ")}
    >
      {isActive ? "Đang hoạt động" : status}
    </span>
  );
}

export function MemberSubscriptionPanel() {
  const { authorizedRequest } = useAuth();
  const subscriptionQuery = useQuery({
    queryKey: ["member-subscription"],
    queryFn: async () => {
      const response = await authorizedRequest<Subscription | null>("/api/v1/me/subscription");
      return response.data;
    },
  });

  /* ---------- Loading ---------- */
  if (subscriptionQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse rounded-3xl bg-slate-100 h-36 w-full" />
        <div className="animate-pulse rounded-2xl bg-slate-100 h-28 w-full" />
        <div className="animate-pulse rounded-2xl bg-slate-100 h-24 w-full" />
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (subscriptionQuery.isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        Không tải được thông tin gói tập. Vui lòng thử lại sau.
      </div>
    );
  }

  const subscription = subscriptionQuery.data;

  /* ---------- No subscription ---------- */
  if (!subscription) {
    return (
      <div
        className="myfit-card flex flex-col items-center gap-4 py-12 text-center"
        style={{ background: "white" }}
      >
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "var(--pastel-pink)" }}
        >
          <Dumbbell size={32} style={{ color: "var(--primary-pink)" }} />
        </span>
        <div>
          <p className="text-base font-semibold" style={{ color: "var(--black)" }}>
            Bạn chưa có gói tập nào
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-500)" }}>
            Đăng ký gói tập để bắt đầu hành trình của bạn.
          </p>
        </div>
        <Link
          href="/packages"
          className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(to right, var(--primary-pink), var(--deep-pink))" }}
        >
          <Dumbbell size={16} />
          Xem gói tập
        </Link>
      </div>
    );
  }

  /* ---------- Session progress ---------- */
  const progressPercent =
    subscription.totalSessions > 0
      ? Math.round((subscription.sessionsUsed / subscription.totalSessions) * 100)
      : 0;

  const days = daysRemaining(subscription.expiresAt);

  /* ---------- Main render ---------- */
  return (
    <div className="space-y-4">
      {/* ── Hero header card ── */}
      <div
        className="rounded-3xl p-5 text-white shadow-lg"
        style={{ background: "linear-gradient(to right, #FF6B9D, #E91E63)" }}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Dumbbell size={22} className="text-white" />
            </span>
            <p className="text-lg font-bold leading-tight tracking-tight">
              Gói tập hiện tại
            </p>
          </div>
          <StatusBadge status={subscription.status} />
        </div>

        {/* Plan code */}
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.75)" }}>
            Mã gói
          </p>
          <p className="mt-0.5 text-xl font-extrabold tracking-wide">
            {subscription.membershipPlanId}
          </p>
        </div>

        {/* Expiry chip */}
        <div
          className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <Clock size={13} />
          Hết hạn: {formatDate(subscription.expiresAt)}
          {days > 0 && (
            <span className="ml-1 font-semibold">· còn {days} ngày</span>
          )}
        </div>
      </div>

      {/* ── Sessions progress ── */}
      <SurfaceCard title="" description="">
        <div className="px-1 py-1 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} style={{ color: "var(--primary-pink)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--charcoal)" }}>
              Số buổi tập
            </p>
          </div>

          {/* Big remaining number */}
          <div className="flex items-end gap-2">
            <span
              className="text-4xl font-extrabold leading-none"
              style={{ color: "var(--deep-pink)" }}
            >
              {subscription.sessionsRemaining}
            </span>
            <span className="mb-1 text-sm" style={{ color: "var(--gray-500)" }}>
              buổi còn lại
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 rounded-full" style={{ background: "var(--blush)" }}>
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: "linear-gradient(to right, var(--primary-pink), var(--deep-pink))",
              }}
            />
          </div>

          <p className="text-xs" style={{ color: "var(--gray-500)" }}>
            {subscription.sessionsUsed} đã dùng&nbsp;/&nbsp;{subscription.totalSessions} tổng
          </p>
        </div>
      </SurfaceCard>

      {/* ── Details grid ── */}
      <SurfaceCard title="" description="">
        <dl className="grid gap-4 sm:grid-cols-2 px-1 py-1">
          {/* Activation date */}
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--pastel-pink)" }}
            >
              <Calendar size={15} style={{ color: "var(--primary-pink)" }} />
            </span>
            <div>
              <dt className="text-xs" style={{ color: "var(--gray-500)" }}>
                Ngày kích hoạt
              </dt>
              <dd className="mt-0.5 text-sm font-semibold" style={{ color: "var(--charcoal)" }}>
                {formatDate(subscription.activatedAt)}
              </dd>
            </div>
          </div>

          {/* Expiry date */}
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--pastel-pink)" }}
            >
              <Clock size={15} style={{ color: "var(--primary-pink)" }} />
            </span>
            <div>
              <dt className="text-xs" style={{ color: "var(--gray-500)" }}>
                Ngày hết hạn
              </dt>
              <dd className="mt-0.5 text-sm font-semibold" style={{ color: "var(--charcoal)" }}>
                {formatDate(subscription.expiresAt)}
              </dd>
              {days > 0 ? (
                <dd className="mt-0.5 text-xs font-medium" style={{ color: "var(--deep-pink)" }}>
                  Còn {days} ngày
                </dd>
              ) : (
                <dd className="mt-0.5 text-xs font-medium text-red-500">
                  Đã hết hạn
                </dd>
              )}
            </div>
          </div>

          {/* Home branch */}
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--pastel-pink)" }}
            >
              <MapPin size={15} style={{ color: "var(--primary-pink)" }} />
            </span>
            <div>
              <dt className="text-xs" style={{ color: "var(--gray-500)" }}>
                Chi nhánh chính
              </dt>
              <dd className="mt-0.5 text-sm font-semibold" style={{ color: "var(--charcoal)" }}>
                {subscription.homeBranchId}
              </dd>
            </div>
          </div>

          {/* Sessions remaining */}
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--pastel-pink)" }}
            >
              <Dumbbell size={15} style={{ color: "var(--primary-pink)" }} />
            </span>
            <div>
              <dt className="text-xs" style={{ color: "var(--gray-500)" }}>
                Buổi còn lại
              </dt>
              <dd
                className="mt-0.5 text-sm font-bold"
                style={{ color: "var(--deep-pink)" }}
              >
                {subscription.sessionsRemaining} buổi
              </dd>
            </div>
          </div>
        </dl>
      </SurfaceCard>
    </div>
  );
}
