"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";

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

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatTime(val: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(val));
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function ManagerDashboardPanel() {
  const { authorizedRequest, session } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const branchId = session?.branchIds?.[0];

  const query = useQuery({
    queryKey: ["manager-dashboard", branchId, date],
    queryFn: async () => {
      const params = new URLSearchParams({ date });
      if (branchId) params.set("branch_id", branchId);
      const res = await authorizedRequest<DashboardData>(`/api/v1/manager/dashboard?${params}`);
      return res.data;
    },
    refetchInterval: 60_000,
  });

  return (
    <AppShell role="MANAGER" title="Dashboard vận hành" description="Tổng quan hoạt động chi nhánh trong ngày.">
      <ScreenIntro eyebrow="Manager" title="Dashboard vận hành" body="Tổng hợp check-in, doanh thu và lịch ca theo ngày." />

      <div className="flex items-center gap-4 mb-6">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          Ngày:
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
          />
        </label>
      </div>

      {query.isLoading && <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>}
      {query.isError && <p className="text-sm text-rose-600">Không tải được dashboard. Thử lại sau.</p>}

      {query.data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Tổng check-in" value={query.data.totalCheckins} />
            <StatCard label="Buổi tập thử" value={query.data.totalTrialBookings} />
            <StatCard label="Hoá đơn đã thanh toán" value={query.data.totalPaidInvoices} />
            <StatCard label="Doanh thu" value={formatVND(query.data.totalRevenue)} />
          </div>

          <SurfaceCard title={`Lịch ca (${query.data.totalShifts} ca)`} description={`Ngày ${query.data.date}`}>
            {query.data.shiftBreakdown.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có ca nào hôm nay.</p>
            ) : (
              <div className="space-y-2">
                {query.data.shiftBreakdown.map(shift => (
                  <div key={shift.shiftId} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800">{shift.shiftCode}</p>
                      <p className="text-xs text-slate-500">{formatTime(shift.startAt)} – {formatTime(shift.endAt)}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                      {shift.checkinCount} check-in
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      )}
    </AppShell>
  );
}
