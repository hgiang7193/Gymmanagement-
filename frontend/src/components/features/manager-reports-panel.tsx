"use client";

import { useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

type ShiftBreakdown = {
  shiftId: string;
  shiftCode: string;
  startAt: string;
  endAt: string;
  checkinCount: number;
};

type DashboardData = {
  branchId: string;
  date: string;
  totalCheckins?: number;
  totalShifts?: number;
  totalTrialBookings?: number;
  totalPaidInvoices?: number;
  totalRevenue?: number;
  shiftBreakdown?: ShiftBreakdown[];
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

type ReviewAggregateRow = {
  target_type: string;
  total_count: number;
  avg_rating: string | number;
  five_star: number;
  one_star: number;
  flagged_count: number;
  hidden_count: number;
};

type ReviewTopRow = {
  target_type: string;
  target_id: string;
  review_count: number;
  avg_rating: string | number;
};

type ReviewSummaryData = {
  branchId: string;
  aggregate?: ReviewAggregateRow[];
  topByType?: ReviewTopRow[];
  sinceDays?: number;
};

type Branch = { id: string; name: string; code: string };

const TABS = [
  { id: "overview",        label: "Tổng quan ngày" },
  { id: "roster",          label: "Danh sách ca" },
  { id: "trial-funnel",    label: "Phễu tập thử" },
  { id: "reconciliation",  label: "Đối soát thu" },
  { id: "reviews-summary", label: "Tổng hợp đánh giá" },
] as const;

type TabId = typeof TABS[number]["id"];

const SHIFT_LABELS: Record<string, string> = {
  MORNING_1: "Sáng 1", MORNING_2: "Sáng 2", MORNING_3: "Sáng 3", MORNING_4: "Sáng 4",
  AFTERNOON_1: "Chiều 1", AFTERNOON_2: "Chiều 2", EVENING_1: "Tối 1", EVENING_2: "Tối 2",
};

const TRIAL_STATUS_LABELS: Record<string, string> = {
  BOOKED: "Đã đặt lịch", CONFIRMED: "Đã xác nhận", ATTENDED: "Đã tập thử",
  CONVERTED: "Đã chuyển đổi", CANCELLED: "Đã huỷ", NO_SHOW: "Vắng mặt",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  shift: "Ca tập", coach: "Huấn luyện viên", equipment: "Thiết bị", exercise: "Bài tập",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function StatCard({ label, value, accent }: { label: string; value: React.ReactNode; accent?: "emerald" | "amber" | "rose" | "slate" }) {
  const colorMap = { emerald: "text-emerald-700", amber: "text-amber-700", rose: "text-rose-700", slate: "text-slate-900" };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${colorMap[accent ?? "slate"]}`}>{value}</div>
    </div>
  );
}

export function ManagerReportsPanel() {
  const queryClient = useQueryClient();
  const { authorizedRequest, session } = useAuth();
  const [tab, setTab] = useState<TabId>("overview");
  const [date, setDate] = useState(todayStr());
  const isAdmin = session?.role === "ADMIN";
  const sessionBranchId = session?.branchIds?.[0] ?? "";
  const [adminBranchFilter, setAdminBranchFilter] = useState("");

  const branchesQuery = useQuery({
    queryKey: ["mgr-reports-branches"],
    queryFn: async () => (await authorizedRequest<Branch[]>("/api/v1/branches")).data ?? [],
  });

  const allBranches = branchesQuery.data ?? [];
  // Chi nhánh đang xem: admin có filter → 1; admin không filter → all; manager → của mình.
  const targetBranches: Branch[] = isAdmin
    ? (adminBranchFilter ? allBranches.filter((b) => b.id === adminBranchFilter) : allBranches)
    : allBranches.filter((b) => b.id === sessionBranchId);

  const aggregateMode = isAdmin && !adminBranchFilter && allBranches.length > 1;

  // === DASHBOARD per-branch ===
  const dashboardQueries = useQueries({
    queries: targetBranches.map((b) => ({
      queryKey: ["mgr-reports-dashboard", date, b.id],
      queryFn: async () => (await authorizedRequest<DashboardData>(`/api/v1/manager/dashboard?date=${date}&branch_id=${b.id}`)).data,
      enabled: (tab === "overview" || tab === "roster") && !!b.id,
    })),
  });

  // === RECONCILIATION per-branch ===
  const reconciliationQueries = useQueries({
    queries: targetBranches.map((b) => ({
      queryKey: ["mgr-reports-reconciliation", date, b.id],
      queryFn: async () => (await authorizedRequest<ReconciliationData>(`/api/v1/manager/reconciliation?date=${date}&branch_id=${b.id}`)).data,
      enabled: tab === "reconciliation" && !!b.id,
    })),
  });

  // === FUNNEL per-branch ===
  const funnelQueries = useQueries({
    queries: targetBranches.map((b) => ({
      queryKey: ["mgr-reports-funnel", b.id],
      queryFn: async () => (await authorizedRequest<FunnelData>(`/api/v1/manager/trials/funnel?branch_id=${b.id}`)).data,
      enabled: tab === "trial-funnel" && !!b.id,
    })),
  });

  // === REVIEWS SUMMARY per-branch ===
  const reviewQueries = useQueries({
    queries: targetBranches.map((b) => ({
      queryKey: ["mgr-reports-reviews-summary", b.id],
      queryFn: async () => (await authorizedRequest<ReviewSummaryData>(`/api/v1/manager/reviews/summary?branch_id=${b.id}`)).data,
      enabled: tab === "reviews-summary" && !!b.id,
    })),
  });

  const reconcileMutation = useMutation({
    mutationFn: async (branchId: string) => {
      const response = await authorizedRequest("/api/v1/manager/reconciliation/confirm", {
        method: "POST",
        body: JSON.stringify({ date, branchId, notes: "End-of-day reconciliation" }),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Đã ghi nhật ký đối soát ca cuối ngày " + date);
      void queryClient.invalidateQueries({ queryKey: ["mgr-reports-reconciliation"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Đối soát thất bại"),
  });

  // === AGGREGATIONS ===
  const dashData = dashboardQueries.map((q) => q.data).filter((d): d is DashboardData => !!d);
  const dashTotals = dashData.reduce(
    (acc, d) => ({
      checkins: acc.checkins + (d.totalCheckins ?? 0),
      shifts: acc.shifts + (d.totalShifts ?? 0),
      trials: acc.trials + (d.totalTrialBookings ?? 0),
      paidInvoices: acc.paidInvoices + (d.totalPaidInvoices ?? 0),
      revenue: acc.revenue + (d.totalRevenue ?? 0),
    }),
    { checkins: 0, shifts: 0, trials: 0, paidInvoices: 0, revenue: 0 },
  );

  const reconData = reconciliationQueries.map((q) => q.data).filter((d): d is ReconciliationData => !!d);
  const reconTotals = reconData.reduce(
    (acc, d) => ({
      totalInvoices: acc.totalInvoices + (d.totalInvoices ?? 0),
      paidCount: acc.paidCount + (d.paidCount ?? 0),
      pendingCount: acc.pendingCount + (d.pendingCount ?? 0),
      totalRevenue: acc.totalRevenue + (d.totalRevenue ?? 0),
    }),
    { totalInvoices: 0, paidCount: 0, pendingCount: 0, totalRevenue: 0 },
  );

  const funnelData = funnelQueries.map((q) => q.data).filter((d): d is FunnelData => !!d);
  const funnelTotals = funnelData.reduce(
    (acc, d) => {
      acc.total += d.total ?? 0;
      for (const [k, v] of Object.entries(d.byStatus ?? {})) {
        acc.byStatus[k] = (acc.byStatus[k] ?? 0) + v;
      }
      return acc;
    },
    { total: 0, byStatus: {} as Record<string, number> },
  );

  // Aggregate reviews: sum counts; weighted avg = sum(count*avg)/sum(count)
  const reviewData = reviewQueries.map((q) => q.data).filter((d): d is ReviewSummaryData => !!d);
  const reviewAggMap = new Map<string, { total: number; ratingSum: number; five: number; one: number; flagged: number; hidden: number }>();
  for (const r of reviewData) {
    for (const row of r.aggregate ?? []) {
      const key = row.target_type;
      const cur = reviewAggMap.get(key) ?? { total: 0, ratingSum: 0, five: 0, one: 0, flagged: 0, hidden: 0 };
      const count = row.total_count ?? 0;
      cur.total += count;
      cur.ratingSum += count * Number(row.avg_rating ?? 0);
      cur.five += row.five_star ?? 0;
      cur.one += row.one_star ?? 0;
      cur.flagged += row.flagged_count ?? 0;
      cur.hidden += row.hidden_count ?? 0;
      reviewAggMap.set(key, cur);
    }
  }
  const reviewAggregate = Array.from(reviewAggMap.entries()).map(([target_type, v]) => ({
    target_type,
    total_count: v.total,
    avg_rating: v.total > 0 ? v.ratingSum / v.total : 0,
    five_star: v.five, one_star: v.one, flagged_count: v.flagged, hidden_count: v.hidden,
  }));

  // For topByType in aggregate mode: flatten all branches' topByType, then re-sort
  const reviewTopAll = reviewData.flatMap((r) => r.topByType ?? []).sort((a, b) => (b.review_count - a.review_count) || (Number(b.avg_rating) - Number(a.avg_rating))).slice(0, 10);

  const scopeLabel = aggregateMode
    ? `Tổng hợp ${allBranches.length} chi nhánh`
    : (targetBranches[0] ? `${targetBranches[0].name} (${targetBranches[0].code})` : "—");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="myfit-tab-bar">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`myfit-tab-pill ${tab === t.id ? "myfit-tab-pill--active" : "myfit-tab-pill--ghost"}`}
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
        {isAdmin ? (
          <select
            value={adminBranchFilter}
            onChange={(e) => setAdminBranchFilter(e.target.value)}
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">Tất cả chi nhánh</option>
            {allBranches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </select>
        ) : null}
      </div>

      <p className="text-sm text-slate-600">Phạm vi: <span className="font-semibold text-slate-900">{scopeLabel}</span></p>

      {tab === "overview" ? (
        <SurfaceCard title="Tổng quan ngày" description={`Chỉ số vận hành ngày ${date}`}>
          {dashboardQueries.some((q) => q.isLoading) && dashData.length === 0 ? (
            <p className="text-sm text-slate-600">Đang tải...</p>
          ) : null}
          {dashData.length > 0 ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <StatCard label="Lượt điểm danh" value={dashTotals.checkins} accent="emerald" />
                <StatCard label="Số ca trong ngày" value={dashTotals.shifts} accent="slate" />
                <StatCard label="Lịch tập thử mới" value={dashTotals.trials} accent="amber" />
                <StatCard label="Hoá đơn đã thu" value={dashTotals.paidInvoices} accent="slate" />
                <StatCard label="Doanh thu" value={formatCurrency(dashTotals.revenue)} accent="emerald" />
              </div>
              {aggregateMode && dashData.length > 1 ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">Chi nhánh</th>
                        <th className="px-4 py-2 text-right font-semibold">Điểm danh</th>
                        <th className="px-4 py-2 text-right font-semibold">Ca</th>
                        <th className="px-4 py-2 text-right font-semibold">Tập thử</th>
                        <th className="px-4 py-2 text-right font-semibold">Hoá đơn</th>
                        <th className="px-4 py-2 text-right font-semibold">Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {targetBranches.map((b, i) => {
                        const d = dashboardQueries[i]?.data;
                        return (
                          <tr key={b.id}>
                            <td className="px-4 py-2 font-semibold text-slate-800">{b.name} <span className="text-xs text-slate-500">({b.code})</span></td>
                            <td className="px-4 py-2 text-right font-bold text-emerald-700">{d?.totalCheckins ?? 0}</td>
                            <td className="px-4 py-2 text-right">{d?.totalShifts ?? 0}</td>
                            <td className="px-4 py-2 text-right">{d?.totalTrialBookings ?? 0}</td>
                            <td className="px-4 py-2 text-right">{d?.totalPaidInvoices ?? 0}</td>
                            <td className="px-4 py-2 text-right font-semibold text-amber-700">{formatCurrency(d?.totalRevenue ?? 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          ) : null}
        </SurfaceCard>
      ) : null}

      {tab === "roster" ? (
        <SurfaceCard title="Danh sách ca tập" description={`Số lượt điểm danh từng ca ngày ${date}`}>
          {dashboardQueries.some((q) => q.isLoading) && dashData.length === 0 ? (
            <p className="text-sm text-slate-600">Đang tải...</p>
          ) : null}
          {targetBranches.map((b, i) => {
            const d = dashboardQueries[i]?.data;
            const breakdown = d?.shiftBreakdown ?? [];
            return (
              <div key={b.id} className="mb-4">
                {aggregateMode ? (
                  <h4 className="mb-2 text-sm font-semibold text-slate-800">{b.name} <span className="text-xs text-slate-500">({b.code})</span></h4>
                ) : null}
                {breakdown.length === 0 ? (
                  <p className="text-sm text-slate-500">Ngày này chưa có ca tập nào.</p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Ca</th>
                          <th className="px-4 py-2 text-left font-semibold">Khung giờ</th>
                          <th className="px-4 py-2 text-right font-semibold">Đã điểm danh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {breakdown.map((s) => (
                          <tr key={s.shiftId}>
                            <td className="px-4 py-2 font-semibold text-slate-800">{SHIFT_LABELS[s.shiftCode] ?? s.shiftCode}</td>
                            <td className="px-4 py-2 text-slate-700">{formatTime(s.startAt)} – {formatTime(s.endAt)}</td>
                            <td className="px-4 py-2 text-right font-bold text-emerald-700">{s.checkinCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          <p className="mt-3 text-xs text-slate-500">
            Chi tiết hội viên từng ca tại <a href="/manager/check-ins" className="font-semibold text-amber-700 hover:underline">/manager/check-ins</a>.
          </p>
        </SurfaceCard>
      ) : null}

      {tab === "trial-funnel" ? (
        <SurfaceCard title="Phễu tập thử" description={aggregateMode ? "Tổng hợp lịch tập thử toàn hệ thống" : "Phân bố trạng thái lịch tập thử"}>
          {funnelQueries.some((q) => q.isLoading) && funnelData.length === 0 ? (
            <p className="text-sm text-slate-600">Đang tải...</p>
          ) : null}
          {funnelData.length > 0 ? (
            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold text-slate-900">{funnelTotals.total}</div>
                <p className="text-xs uppercase text-slate-500">Tổng lượt đặt lịch</p>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {Object.entries(funnelTotals.byStatus).map(([status, count]) => (
                  <div key={status} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <div className="text-xs uppercase text-slate-500">{TRIAL_STATUS_LABELS[status] ?? status}</div>
                    <div className="text-xl font-bold text-slate-900">{count}</div>
                  </div>
                ))}
              </div>
              {aggregateMode && funnelData.length > 1 ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">Chi nhánh</th>
                        <th className="px-4 py-2 text-right font-semibold">Tổng đặt lịch</th>
                        {Object.keys(funnelTotals.byStatus).map((s) => (
                          <th key={s} className="px-4 py-2 text-right font-semibold">{TRIAL_STATUS_LABELS[s] ?? s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {targetBranches.map((b, i) => {
                        const f = funnelQueries[i]?.data;
                        return (
                          <tr key={b.id}>
                            <td className="px-4 py-2 font-semibold text-slate-800">{b.name}</td>
                            <td className="px-4 py-2 text-right">{f?.total ?? 0}</td>
                            {Object.keys(funnelTotals.byStatus).map((s) => (
                              <td key={s} className="px-4 py-2 text-right">{f?.byStatus?.[s] ?? 0}</td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}
        </SurfaceCard>
      ) : null}

      {tab === "reconciliation" ? (
        <SurfaceCard title="Đối soát thu ngân" description={`Tổng kết hoá đơn ngày ${date}`}>
          {reconciliationQueries.some((q) => q.isLoading) && reconData.length === 0 ? (
            <p className="text-sm text-slate-600">Đang tải...</p>
          ) : null}
          {reconData.length > 0 ? (
            <>
              <div className="grid gap-3 md:grid-cols-4">
                <StatCard label="Tổng hoá đơn" value={reconTotals.totalInvoices} accent="slate" />
                <StatCard label="Đã thanh toán" value={reconTotals.paidCount} accent="emerald" />
                <StatCard label="Chờ thanh toán" value={reconTotals.pendingCount} accent="amber" />
                <StatCard label="Tổng doanh thu" value={formatCurrency(reconTotals.totalRevenue)} accent="emerald" />
              </div>
              {reconTotals.totalInvoices === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Ngày này chưa có hoá đơn nào.</p>
              ) : null}
              {aggregateMode && reconData.length > 1 ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">Chi nhánh</th>
                        <th className="px-4 py-2 text-right font-semibold">Hoá đơn</th>
                        <th className="px-4 py-2 text-right font-semibold">Đã thu</th>
                        <th className="px-4 py-2 text-right font-semibold">Chờ thu</th>
                        <th className="px-4 py-2 text-right font-semibold">Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {targetBranches.map((b, i) => {
                        const r = reconciliationQueries[i]?.data;
                        return (
                          <tr key={b.id}>
                            <td className="px-4 py-2 font-semibold text-slate-800">{b.name}</td>
                            <td className="px-4 py-2 text-right">{r?.totalInvoices ?? 0}</td>
                            <td className="px-4 py-2 text-right text-emerald-700 font-semibold">{r?.paidCount ?? 0}</td>
                            <td className="px-4 py-2 text-right text-amber-700">{r?.pendingCount ?? 0}</td>
                            <td className="px-4 py-2 text-right font-bold text-emerald-700">{formatCurrency(r?.totalRevenue ?? 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {!aggregateMode && targetBranches[0] ? (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      toast("Xác nhận đối soát cuối ngày?", {
                        description: `Ngày ${date} · ${targetBranches[0]?.name ?? ""}`,
                        action: { label: "Xác nhận", onClick: () => reconcileMutation.mutate(targetBranches[0].id) },
                        cancel: { label: "Huỷ", onClick: () => {} },
                      });
                    }}
                    disabled={reconcileMutation.isPending}
                    className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:bg-emerald-300"
                  >
                    {reconcileMutation.isPending ? "Đang xác nhận..." : "Xác nhận đối soát ca cuối ngày"}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </SurfaceCard>
      ) : null}

      {tab === "reviews-summary" ? (
        <SurfaceCard title="Tổng hợp đánh giá" description={aggregateMode ? "Tổng hợp đánh giá toàn hệ thống (30 ngày gần nhất)" : "Đánh giá 30 ngày gần nhất"}>
          {reviewQueries.some((q) => q.isLoading) && reviewData.length === 0 ? (
            <p className="text-sm text-slate-600">Đang tải...</p>
          ) : null}
          {reviewData.length > 0 ? (
            <div className="space-y-5">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">Tổng quan theo đối tượng</h4>
                {reviewAggregate.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có đánh giá nào.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {reviewAggregate.map((row) => (
                      <div key={row.target_type} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-semibold text-slate-800">{TARGET_TYPE_LABELS[row.target_type] ?? row.target_type}</span>
                          <span className="text-xs uppercase text-slate-500">{row.total_count} đánh giá</span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-amber-500">★ {Number(row.avg_rating).toFixed(2)}</span>
                          <span className="text-xs text-slate-500">/ 5.00</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl bg-emerald-50 px-3 py-2">
                            <div className="text-emerald-700 font-semibold">5★</div>
                            <div className="text-base font-bold text-emerald-800">{row.five_star}</div>
                          </div>
                          <div className="rounded-xl bg-rose-50 px-3 py-2">
                            <div className="text-rose-700 font-semibold">1★</div>
                            <div className="text-base font-bold text-rose-800">{row.one_star}</div>
                          </div>
                          <div className="rounded-xl bg-amber-50 px-3 py-2">
                            <div className="text-amber-700 font-semibold">Bị gắn cờ</div>
                            <div className="text-base font-bold text-amber-800">{row.flagged_count}</div>
                          </div>
                          <div className="rounded-xl bg-slate-100 px-3 py-2">
                            <div className="text-slate-600 font-semibold">Đã ẩn</div>
                            <div className="text-base font-bold text-slate-800">{row.hidden_count}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">Top đánh giá theo từng đối tượng</h4>
                {reviewTopAll.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Loại</th>
                          <th className="px-4 py-2 text-left font-semibold">Mã đối tượng</th>
                          <th className="px-4 py-2 text-right font-semibold">Số đánh giá</th>
                          <th className="px-4 py-2 text-right font-semibold">Điểm trung bình</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reviewTopAll.map((row, i) => (
                          <tr key={`${row.target_type}-${row.target_id}-${i}`}>
                            <td className="px-4 py-2 font-semibold text-slate-800">{TARGET_TYPE_LABELS[row.target_type] ?? row.target_type}</td>
                            <td className="px-4 py-2 font-mono text-xs text-slate-600">{row.target_id.length > 24 ? row.target_id.slice(0, 8) + "…" : row.target_id}</td>
                            <td className="px-4 py-2 text-right">{row.review_count}</td>
                            <td className="px-4 py-2 text-right font-bold text-amber-600">★ {Number(row.avg_rating).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </SurfaceCard>
      ) : null}
    </div>
  );
}
