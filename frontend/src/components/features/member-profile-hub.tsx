"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

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
} | null;

type Attendance = {
  id: string;
  shiftId: string;
  branchId: string;
  checkInTime: string;
  status: string;
  proxyCheckin?: boolean;
};

type Invoice = {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

type WeightLog = {
  id: string;
  weightKg: number;
  measuredAt: string;
};

type ProgressResponse = {
  weightLogs: WeightLog[];
  bodyMeasurements: unknown[];
  healthProfile: unknown;
};

const TABS = [
  { id: "checkins", label: "Lịch sử check-in" },
  { id: "subscription", label: "Gói đang dùng" },
  { id: "invoices", label: "Hoá đơn" },
  { id: "health", label: "Tiến trình sức khoẻ" },
] as const;

type TabId = typeof TABS[number]["id"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function MemberProfileHub() {
  const { authorizedRequest } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("checkins");

  const subscriptionQuery = useQuery({
    queryKey: ["hub-subscription"],
    queryFn: async () => (await authorizedRequest<Subscription>("/api/v1/me/subscription")).data,
    enabled: activeTab === "subscription",
  });
  const attendanceQuery = useQuery({
    queryKey: ["hub-attendance"],
    queryFn: async () => (await authorizedRequest<Attendance[]>("/api/v1/member/attendance")).data,
    enabled: activeTab === "checkins",
  });
  const invoicesQuery = useQuery({
    queryKey: ["hub-invoices"],
    queryFn: async () => (await authorizedRequest<Invoice[]>("/api/v1/member/invoices")).data,
    enabled: activeTab === "invoices",
  });
  const progressQuery = useQuery({
    queryKey: ["hub-progress"],
    queryFn: async () => (await authorizedRequest<ProgressResponse>("/api/v1/health/progress")).data,
    enabled: activeTab === "health",
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "checkins" ? (
        <SurfaceCard title="Lịch sử check-in" description="Tất cả các buổi tập đã được ghi nhận.">
          {attendanceQuery.isLoading ? <p className="text-sm text-slate-600">Đang tải...</p> : null}
          {(attendanceQuery.data ?? []).length === 0 && !attendanceQuery.isLoading ? (
            <p className="text-sm text-slate-500">Chưa có buổi tập nào. Hãy bắt đầu với buổi đầu tiên!</p>
          ) : null}
          <div className="space-y-2">
            {(attendanceQuery.data ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <div>
                  <div className="font-medium text-slate-900">{formatDate(a.checkInTime)}</div>
                  <div className="text-xs text-slate-500">Ca: {a.shiftId.slice(0, 12)}...</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{a.status}</span>
                  {a.proxyCheckin ? <span className="text-xs text-amber-700">Proxy check-in</span> : null}
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      {activeTab === "subscription" ? (
        <SurfaceCard title="Gói đang dùng" description="Trạng thái subscription hiện tại.">
          {subscriptionQuery.isLoading ? <p className="text-sm text-slate-600">Đang tải...</p> : null}
          {!subscriptionQuery.data && !subscriptionQuery.isLoading ? (
            <p className="text-sm text-slate-500">Bạn chưa có gói tập nào active.</p>
          ) : null}
          {subscriptionQuery.data ? (
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-slate-500">Trạng thái</dt>
                <dd className="font-semibold text-slate-950">{subscriptionQuery.data.status}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Buổi còn / tổng</dt>
                <dd className="font-semibold text-slate-950">
                  {subscriptionQuery.data.sessionsRemaining}/{subscriptionQuery.data.totalSessions}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Bắt đầu</dt>
                <dd>{formatDate(subscriptionQuery.data.startedAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Hết hạn</dt>
                <dd>{formatDate(subscriptionQuery.data.expiresAt)}</dd>
              </div>
            </dl>
          ) : null}
        </SurfaceCard>
      ) : null}

      {activeTab === "invoices" ? (
        <SurfaceCard title="Hoá đơn của tôi" description="Lịch sử thanh toán.">
          {invoicesQuery.isLoading ? <p className="text-sm text-slate-600">Đang tải...</p> : null}
          {(invoicesQuery.data ?? []).length === 0 && !invoicesQuery.isLoading ? (
            <p className="text-sm text-slate-500">Chưa có hoá đơn nào.</p>
          ) : null}
          <div className="space-y-2">
            {(invoicesQuery.data ?? []).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <div>
                  <div className="font-medium text-slate-900">{formatCurrency(inv.totalAmount)}</div>
                  <div className="text-xs text-slate-500">{formatDate(inv.createdAt)}</div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    inv.status === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : inv.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      {activeTab === "health" ? (
        <SurfaceCard title="Tiến trình sức khoẻ" description="Lịch sử cân nặng và đo cơ thể.">
          {progressQuery.isLoading ? <p className="text-sm text-slate-600">Đang tải...</p> : null}
          {(progressQuery.data?.weightLogs ?? []).length === 0 && !progressQuery.isLoading ? (
            <p className="text-sm text-slate-500">Chưa có dữ liệu cân nặng.</p>
          ) : null}
          <div className="space-y-2">
            {(progressQuery.data?.weightLogs ?? []).slice(0, 20).map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2 text-sm">
                <span>{formatDate(w.measuredAt)}</span>
                <span className="font-semibold text-slate-900">{w.weightKg} kg</span>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
