"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

type DashboardData = {
  branchId: string;
  date: string;
  checkinsToday?: number;
  posRevenueToday?: number;
  trialsCreatedToday?: number;
  [key: string]: unknown;
};

type ReconciliationData = {
  date: string;
  branchId: string;
  totalInvoices: number;
  paidCount: number;
  pendingCount: number;
  totalRevenue: number;
};

type FunnelData = {
  branchId: string;
  total: number;
  byStatus: Record<string, number>;
};

type ReviewSummaryData = {
  branchId: string;
  total?: number;
  averageRating?: number;
  byTargetType?: Record<string, { count: number; averageRating: number }>;
};

const TABS = [
  { id: "overview",        label: "Tổng quan ngày" },
  { id: "roster",          label: "Roster ca" },
  { id: "trial-funnel",    label: "Funnel trial" },
  { id: "reconciliation",  label: "Đối soát thu" },
  { id: "reviews-summary", label: "Tổng hợp đánh giá" },
] as const;

type TabId = typeof TABS[number]["id"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ManagerReportsPanel() {
  const queryClient = useQueryClient();
  const { authorizedRequest } = useAuth();
  const [tab, setTab] = useState<TabId>("overview");
  const [date, setDate] = useState(todayStr());

  const dashboardQuery = useQuery({
    queryKey: ["mgr-reports-dashboard", date],
    queryFn: async () => (await authorizedRequest<DashboardData>(`/api/v1/manager/dashboard?date=${date}`)).data,
    enabled: tab === "overview",
  });

  const reconciliationQuery = useQuery({
    queryKey: ["mgr-reports-reconciliation", date],
    queryFn: async () => (await authorizedRequest<ReconciliationData>(`/api/v1/manager/reconciliation?date=${date}`)).data,
    enabled: tab === "reconciliation",
  });

  const funnelQuery = useQuery({
    queryKey: ["mgr-reports-funnel"],
    queryFn: async () => (await authorizedRequest<FunnelData>("/api/v1/manager/trials/funnel")).data,
    enabled: tab === "trial-funnel",
  });

  const reviewSummaryQuery = useQuery({
    queryKey: ["mgr-reports-reviews-summary"],
    queryFn: async () => (await authorizedRequest<ReviewSummaryData>("/api/v1/manager/reviews/summary")).data,
    enabled: tab === "reviews-summary",
  });

  const reconcileMutation = useMutation({
    mutationFn: async () => {
      const response = await authorizedRequest("/api/v1/manager/reconciliation/confirm", {
        method: "POST",
        body: JSON.stringify({ date, notes: "End-of-day reconciliation" }),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Đã ghi audit shift_reconciled cho ngày " + date);
      void queryClient.invalidateQueries({ queryKey: ["mgr-reports-reconciliation"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Đối soát thất bại"),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                tab === t.id ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {tab === "overview" ? (
        <SurfaceCard title="Tổng quan ngày" description={`Báo cáo nhanh cho ${date}`}>
          {dashboardQuery.isLoading ? <p className="text-sm text-slate-600">Đang tải...</p> : null}
          {dashboardQuery.data ? (
            <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs text-emerald-200">
              {JSON.stringify(dashboardQuery.data, null, 2)}
            </pre>
          ) : null}
        </SurfaceCard>
      ) : null}

      {tab === "roster" ? (
        <SurfaceCard title="Roster theo ca" description="Để xem roster, vào trang Manager Check-ins và chọn ca.">
          <p className="text-sm text-slate-600">
            Roster real-time có sẵn tại{" "}
            <a href="/manager/check-ins" className="font-semibold text-amber-700 hover:underline">
              /manager/check-ins
            </a>{" "}
            — chọn 1 ca cụ thể để xem danh sách check-in.
          </p>
        </SurfaceCard>
      ) : null}

      {tab === "trial-funnel" ? (
        <SurfaceCard title="Funnel trial" description="Tỷ lệ chuyển đổi từ booked → converted">
          {funnelQuery.isLoading ? <p className="text-sm text-slate-600">Đang tải...</p> : null}
          {funnelQuery.data ? (
            <div className="space-y-3">
              <div className="text-3xl font-bold text-slate-900">{funnelQuery.data.total}</div>
              <p className="text-xs uppercase text-slate-500">Tổng booking</p>
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(funnelQuery.data.byStatus ?? {}).map(([status, count]) => (
                  <div key={status} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <div className="text-xs uppercase text-slate-500">{status}</div>
                    <div className="text-xl font-bold text-slate-900">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </SurfaceCard>
      ) : null}

      {tab === "reconciliation" ? (
        <SurfaceCard title="Đối soát thu ngân" description={`Kết quả ngày ${date}`}>
          {reconciliationQuery.isLoading ? <p className="text-sm text-slate-600">Đang tải...</p> : null}
          {reconciliationQuery.data ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-xs uppercase text-slate-500">Tổng doanh thu</div>
                <div className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(reconciliationQuery.data.totalRevenue ?? 0)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-xs uppercase text-slate-500">Đã thanh toán</div>
                <div className="text-2xl font-bold text-slate-900">{reconciliationQuery.data.paidCount}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-xs uppercase text-slate-500">Pending</div>
                <div className="text-2xl font-bold text-amber-700">{reconciliationQuery.data.pendingCount}</div>
              </div>
            </div>
          ) : null}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Xác nhận đối soát cuối ngày cho ${date}?`)) {
                  reconcileMutation.mutate();
                }
              }}
              disabled={reconcileMutation.isPending}
              className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:bg-emerald-300"
            >
              {reconcileMutation.isPending ? "Đang xác nhận..." : "Xác nhận đối soát ca cuối ngày"}
            </button>
          </div>
        </SurfaceCard>
      ) : null}

      {tab === "reviews-summary" ? (
        <SurfaceCard title="Tổng hợp đánh giá" description="Số lượng và rating trung bình theo target_type">
          {reviewSummaryQuery.isLoading ? <p className="text-sm text-slate-600">Đang tải...</p> : null}
          {reviewSummaryQuery.data ? (
            <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs text-emerald-200">
              {JSON.stringify(reviewSummaryQuery.data, null, 2)}
            </pre>
          ) : null}
        </SurfaceCard>
      ) : null}
    </div>
  );
}
