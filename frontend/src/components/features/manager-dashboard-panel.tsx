"use client";

import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Loader2, MapPin, Calendar } from "lucide-react";

type ShiftBreakdown = { shiftId: string; shiftCode: string; startAt: string; endAt: string; checkinCount: number };
type DashboardData = {
  date: string;
  branchId: string;
  totalCheckins: number;
  totalShifts: number;
  totalTrialBookings: number;
  totalPaidInvoices: number;
  totalRevenue: number;
  shiftBreakdown: ShiftBreakdown[];
};
type BranchOption = { id: string; name: string; code: string };

const SHIFT_LABELS: Record<string, string> = {
  MORNING_1: "Sáng 1",
  MORNING_2: "Sáng 2",
  MORNING_3: "Sáng 3",
  MORNING_4: "Sáng 4",
  AFTERNOON_1: "Chiều 1",
  AFTERNOON_2: "Chiều 2",
  EVENING_1: "Tối 1",
  EVENING_2: "Tối 2",
};

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

function formatTime(val: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(val));
}

function todayLocalStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type StatCardAccent = "checkins" | "shifts" | "trials" | "invoices" | "revenue";

const STAT_STYLES: Record<StatCardAccent, { border: string; value: string; bg: string; icon: string }> = {
  checkins: {
    border: "border-l-emerald-500",
    value:  "text-emerald-700",
    bg:     "bg-emerald-50",
    icon:   "text-emerald-400",
  },
  shifts: {
    border: "border-l-violet-500",
    value:  "text-violet-700",
    bg:     "bg-violet-50",
    icon:   "text-violet-400",
  },
  trials: {
    border: "border-l-amber-500",
    value:  "text-amber-700",
    bg:     "bg-amber-50",
    icon:   "text-amber-400",
  },
  invoices: {
    border: "border-l-blue-500",
    value:  "text-blue-700",
    bg:     "bg-blue-50",
    icon:   "text-blue-400",
  },
  revenue: {
    border: "border-l-rose-500",
    value:  "text-rose-700",
    bg:     "bg-rose-50",
    icon:   "text-rose-400",
  },
};

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: StatCardAccent }) {
  const s = STAT_STYLES[accent];
  return (
    <div
      className={`rounded-2xl bg-white border border-[var(--blush)] shadow-sm p-4 border-l-4 ${s.border} flex flex-col gap-1`}
    >
      <p className="text-xs uppercase tracking-wide text-[var(--gray-500)] font-semibold leading-none">{label}</p>
      <p className={`text-2xl font-bold mt-2 myfit-number ${s.value}`}>{value}</p>
    </div>
  );
}

function ShiftRow({ s, maxCount }: { s: ShiftBreakdown; maxCount: number }) {
  const pct = maxCount > 0 ? Math.round((s.checkinCount / maxCount) * 100) : 0;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--gray-100)] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[var(--black)]">
            {SHIFT_LABELS[s.shiftCode] ?? s.shiftCode}
          </span>
          <span className="text-[11px] text-[var(--gray-500)]">
            {formatTime(s.startAt)}–{formatTime(s.endAt)}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-violet-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
        {s.checkinCount}
      </span>
    </div>
  );
}

function BranchCard({ branch, data }: { branch: BranchOption; data: DashboardData | undefined }) {
  if (!data) {
    return (
      <SurfaceCard title={`${branch.name} (${branch.code})`} description="Đang tải dữ liệu...">
        <div className="flex items-center gap-2 py-4 text-sm text-[var(--gray-500)]">
          <Loader2 size={16} className="animate-spin text-violet-400" />
          <span>Đang tải...</span>
        </div>
      </SurfaceCard>
    );
  }

  const maxCount = data.shiftBreakdown.reduce((m, s) => Math.max(m, s.checkinCount), 0);

  return (
    <div className="myfit-surface p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-2">
        <MapPin size={16} className="mt-0.5 shrink-0 text-violet-500" />
        <div className="min-w-0">
          <h3 className="font-bold text-[var(--black)] leading-tight">{branch.name}</h3>
          <p className="text-xs text-[var(--gray-500)] mt-0.5">
            Mã: <span className="font-semibold text-violet-600">{branch.code}</span>
            {" · "}
            {data.totalShifts} ca · {data.totalCheckins} điểm danh · {data.totalPaidInvoices} hoá đơn
          </p>
        </div>
      </div>

      {/* Mini metric grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Điểm danh</p>
          <p className="text-xl font-bold text-emerald-700 myfit-number mt-0.5">{data.totalCheckins}</p>
        </div>
        <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">Doanh thu</p>
          <p className="text-base font-bold text-rose-700 myfit-number mt-0.5 truncate">{formatVND(data.totalRevenue)}</p>
        </div>
      </div>

      {/* Shift breakdown */}
      {data.shiftBreakdown.length > 0 ? (
        <div className="space-y-1.5">
          {data.shiftBreakdown.map((s) => (
            <ShiftRow key={s.shiftId} s={s} maxCount={maxCount} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[var(--blush)] py-6 text-center">
          <Calendar size={20} className="text-[var(--gray-500)]" />
          <p className="text-sm text-[var(--gray-500)]">Chưa có ca nào trong ngày này.</p>
        </div>
      )}
    </div>
  );
}

export function ManagerDashboardPanel() {
  const { authorizedRequest, session } = useAuth();
  const [date, setDate] = useState(todayLocalStr());
  const isAdmin = session?.role === "ADMIN";
  const sessionBranchId = session?.branchIds?.[0] ?? "";
  const [adminBranchFilter, setAdminBranchFilter] = useState("");

  const branchesQuery = useQuery({
    queryKey: ["dashboard-branches"],
    queryFn: async () => (await authorizedRequest<BranchOption[]>("/api/v1/branches")).data ?? [],
  });

  const allBranches = branchesQuery.data ?? [];
  const targetBranches: BranchOption[] = isAdmin
    ? (adminBranchFilter
        ? allBranches.filter((b) => b.id === adminBranchFilter)
        : allBranches)
    : allBranches.filter((b) => b.id === sessionBranchId);

  const branchQueries = useQueries({
    queries: targetBranches.map((b) => ({
      queryKey: ["manager-dashboard", b.id, date],
      queryFn: async () => {
        const params = new URLSearchParams({ date, branch_id: b.id });
        const res = await authorizedRequest<DashboardData>(`/api/v1/manager/dashboard?${params}`);
        return res.data;
      },
      enabled: !!b.id,
      refetchInterval: 60_000,
    })),
  });

  const isLoading = branchesQuery.isLoading || branchQueries.some((q) => q.isLoading);
  const allData = branchQueries.map((q) => q.data).filter((d): d is DashboardData => !!d);

  const totals = allData.reduce(
    (acc, d) => ({
      checkins:     acc.checkins     + (d.totalCheckins       ?? 0),
      shifts:       acc.shifts       + (d.totalShifts         ?? 0),
      trials:       acc.trials       + (d.totalTrialBookings  ?? 0),
      paidInvoices: acc.paidInvoices + (d.totalPaidInvoices   ?? 0),
      revenue:      acc.revenue      + (d.totalRevenue        ?? 0),
    }),
    { checkins: 0, shifts: 0, trials: 0, paidInvoices: 0, revenue: 0 },
  );

  const description = isAdmin
    ? (adminBranchFilter
        ? `Chi tiết chi nhánh được lọc, ngày ${date}`
        : `Tổng hợp ${allBranches.length} chi nhánh, ngày ${date}`)
    : `Chi nhánh của bạn, ngày ${date}`;

  return (
    <AppShell role="MANAGER" title="Tổng quan vận hành" description="Tổng hợp điểm danh, doanh thu và lịch ca theo ngày, đa chi nhánh.">

      {/* Filter bar */}
      <div className="myfit-surface px-4 py-3 flex flex-wrap items-center gap-4">
        {isAdmin && (
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--gray-500)]">
            Chi nhánh
            <select
              value={adminBranchFilter}
              onChange={(e) => setAdminBranchFilter(e.target.value)}
              className="myfit-input !h-9 !text-sm !rounded-xl normal-case tracking-normal font-normal text-[var(--black)] w-auto"
            >
              <option value="">Tất cả chi nhánh</option>
              {allBranches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--gray-500)]">
          Ngày
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="myfit-input !h-9 !text-sm !rounded-xl normal-case tracking-normal font-normal text-[var(--black)] w-auto"
          />
        </label>
        <p className="ml-auto text-xs text-[var(--gray-500)] italic">{description}</p>
      </div>

      {/* Loading state */}
      {isLoading && allData.length === 0 ? (
        <div className="flex items-center justify-center gap-3 py-16 text-[var(--gray-500)]">
          <Loader2 size={22} className="animate-spin text-violet-500" />
          <span className="text-sm font-medium">Đang tải dữ liệu...</span>
        </div>
      ) : null}

      {/* Empty state */}
      {!isLoading && targetBranches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MapPin size={28} className="text-[var(--gray-500)]" />
          <p className="text-sm text-[var(--gray-500)]">Không có chi nhánh nào.</p>
        </div>
      ) : null}

      {allData.length > 0 ? (
        <div className="space-y-6">
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard label="Tổng lượt điểm danh" value={totals.checkins}          accent="checkins" />
            <StatCard label="Tổng số ca"           value={totals.shifts}            accent="shifts"   />
            <StatCard label="Tập thử mới"          value={totals.trials}            accent="trials"   />
            <StatCard label="Hoá đơn đã thu"       value={totals.paidInvoices}      accent="invoices" />
            <StatCard label="Doanh thu tổng"       value={formatVND(totals.revenue)} accent="revenue" />
          </div>

          {/* Branch cards */}
          <div className="grid gap-4 lg:grid-cols-2">
            {targetBranches.map((b, idx) => (
              <BranchCard key={b.id} branch={b} data={branchQueries[idx]?.data} />
            ))}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
