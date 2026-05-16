"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Calendar,
  Camera,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  Heart,
  TrendingUp,
  User,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

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
  shiftCode?: string | null;
  date?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  branchName?: string | null;
  branchCode?: string | null;
  /** Cân nhập khi điểm danh ca (nếu có log khớp thời điểm). */
  checkinWeightKg?: number | string | null;
  checkinWeightSource?: string | null;
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

const SHIFT_LABELS: Record<string, string> = {
  MORNING_1: "Sáng 1",
  MORNING_2: "Sáng 2",
  AFTERNOON_1: "Chiều 1",
  AFTERNOON_2: "Chiều 2",
  EVENING_1: "Tối 1",
  EVENING_2: "Tối 2",
};

const WEIGHT_SOURCE_LABELS: Record<string, string> = {
  manual: "nhập tay khi điểm danh",
  inbody: "máy InBody",
};

const TABS = [
  { id: "checkins", label: "Lịch sử tập", icon: Calendar },
  { id: "subscription", label: "Gói tập",   icon: Dumbbell   },
  { id: "invoices",     label: "Hoá đơn",   icon: CreditCard },
  { id: "health",       label: "Sức khoẻ",  icon: Heart      },
] as const;

type TabId = typeof TABS[number]["id"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatDateShort(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function formatTimeHm(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--gray-100)]" />
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-[var(--pastel-pink)]/50 py-12 text-center text-sm text-[var(--gray-500)]">
      {text}
    </div>
  );
}

function CheckInsTab({ data, loading }: { data: Attendance[]; loading: boolean }) {
  if (loading) return <Skeleton />;
  if (data.length === 0) {
    return (
      <Empty text="Chưa có buổi tập nào. Vào Điểm danh ca — mỗi lần có mặt bạn nhập cân (và hệ thống ghi nhận điểm danh); lịch sử sẽ hiện ở đây." />
    );
  }

  return (
    <div className="space-y-0">
      <p className="mb-3 px-1 text-xs leading-relaxed text-[var(--gray-500)]">
        Mỗi lần điểm danh ca, <strong className="text-[var(--black)]">cân nặng</strong> bạn nhập được lưu vào lịch sử đo và hiển thị kèm buổi tập bên dưới (đồng bộ với UC-MEMBER-01).
      </p>
      {data.map((a, i) => {
        const shiftLabel = a.shiftCode ? (SHIFT_LABELS[a.shiftCode] ?? a.shiftCode) : `Ca ${a.shiftId.slice(0, 8)}…`;
        const branchLabel = a.branchName ?? a.branchCode ?? `${a.branchId.slice(0, 8)}…`;
        const slotTime =
          a.startAt && a.endAt
            ? `${formatTimeHm(a.startAt)} – ${formatTimeHm(a.endAt)}`
            : null;
        const w =
          a.checkinWeightKg !== undefined && a.checkinWeightKg !== null && String(a.checkinWeightKg) !== ""
            ? typeof a.checkinWeightKg === "number"
              ? a.checkinWeightKg
              : parseFloat(String(a.checkinWeightKg))
            : null;
        const srcLabel = a.checkinWeightSource
          ? WEIGHT_SOURCE_LABELS[a.checkinWeightSource] ?? a.checkinWeightSource
          : "";
        const weightLine =
          w !== null && !Number.isNaN(w)
            ? `Cân khi đến tập: ${w} kg${srcLabel ? ` · ${srcLabel}` : ""}`
            : null;

        return (
        <div key={a.id} className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-4 ring-white z-10"
              style={{ background: "linear-gradient(135deg, var(--primary-pink), var(--deep-pink))" }}
            >
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            {i < data.length - 1 && (
              <div className="w-0.5 flex-1 mt-1" style={{ background: "var(--blush)", minHeight: "24px" }} />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-4">
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: "var(--white)", border: "1px solid var(--blush)", boxShadow: "0 2px 12px rgba(255,107,157,0.06)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--black)]">{formatDate(a.checkInTime)}</p>
                  <p className="text-xs text-[var(--gray-500)] mt-0.5">
                    Chi nhánh: <span className="font-medium text-[var(--charcoal)]">{branchLabel}</span>
                  </p>
                  <p className="text-xs text-[var(--gray-500)] mt-0.5">
                    Ca: <span className="font-medium text-[var(--charcoal)]">{shiftLabel}</span>
                    {slotTime ? <span className="text-[var(--gray-500)]"> · {slotTime}</span> : null}
                  </p>
                  {weightLine ? (
                    <p className="text-xs font-semibold text-[var(--deep-pink)] mt-1.5">{weightLine}</p>
                  ) : (
                    <p className="text-[10px] text-[var(--gray-500)] mt-1 italic">
                      Buổi này không có log cân tại điểm danh (ví dụ điểm danh hộ).
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={{ background: "#D1FAE5", color: "#059669" }}
                  >
                    {a.status}
                  </span>
                  {a.proxyCheckin && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: "var(--lavender)", color: "#7C3AED" }}
                    >
                      Proxy
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}

function SubscriptionTab({ data, loading }: { data: Subscription; loading: boolean }) {
  if (loading) return <Skeleton />;
  if (!data) return <Empty text="Bạn chưa có gói tập nào active." />;

  const pct = data.totalSessions > 0 ? Math.round((data.sessionsUsed / data.totalSessions) * 100) : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  const statusMeta: Record<string, { badge: string; text: string; label: string }> = {
    ACTIVE:    { badge: "#D1FAE5", text: "#059669", label: "Đang hoạt động" },
    EXPIRED:   { badge: "var(--gray-100)", text: "var(--gray-500)", label: "Hết hạn" },
    SUSPENDED: { badge: "var(--peach)", text: "#D97706", label: "Tạm dừng" },
  };
  const meta = statusMeta[data.status] ?? statusMeta.EXPIRED;

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--blush)", boxShadow: "0 4px 24px rgba(255,107,157,0.12)" }}
      >
        <div
          className="px-5 pt-5 pb-4"
          style={{ background: "linear-gradient(135deg, var(--pastel-pink) 0%, var(--blush) 50%, var(--lavender) 100%)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--deep-pink)]">Gói hiện tại</p>
            <span
              className="rounded-full px-3 py-0.5 text-[10px] font-bold"
              style={{ background: meta.badge, color: meta.text }}
            >
              {meta.label}
            </span>
          </div>
          <p className="text-lg font-extrabold text-[var(--black)]">{data.membershipPlanId.slice(0, 12)}</p>
        </div>

        <div className="bg-white px-5 py-5">
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <svg width="104" height="104" viewBox="0 0 104 104">
                <circle cx="52" cy="52" r={radius} fill="none" stroke="var(--gray-100)" strokeWidth="9" />
                <circle
                  cx="52" cy="52" r={radius}
                  fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 52 52)"
                  style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }}
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary-pink)" />
                    <stop offset="100%" stopColor="var(--deep-pink)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-extrabold text-[var(--black)] leading-none myfit-number">{pct}%</p>
                <p className="text-[9px] font-medium text-[var(--gray-500)] mt-0.5">đã dùng</p>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--gray-500)] mb-0.5">Buổi còn lại</p>
              <p className="text-4xl font-extrabold leading-none myfit-number" style={{ color: "var(--deep-pink)" }}>
                {data.sessionsRemaining}
                <span className="text-lg font-normal text-[var(--gray-500)]"> / {data.totalSessions}</span>
              </p>
              <p className="text-xs text-[var(--gray-500)] mt-2">
                Đã dùng <span className="font-bold text-[var(--black)]">{data.sessionsUsed}</span> buổi
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y bg-white" style={{ borderTop: "1px solid var(--gray-100)" }}>
          {[
            { label: "Bắt đầu",  value: formatDate(data.startedAt) },
            { label: "Hết hạn",  value: formatDate(data.expiresAt) },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-[var(--gray-500)]">{row.label}</span>
              <span className="text-sm font-semibold text-[var(--black)]">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InvoicesTab({ data, loading }: { data: Invoice[]; loading: boolean }) {
  if (loading) return <Skeleton />;
  if (data.length === 0) return <Empty text="Chưa có hoá đơn nào." />;

  const STATUS_STYLE: Record<string, { badge: string; badgeText: string; border: string; label: string }> = {
    paid:      { badge: "#D1FAE5", badgeText: "#059669", border: "#059669",           label: "Đã TT" },
    pending:   { badge: "var(--peach)", badgeText: "#D97706", border: "var(--peach)", label: "Chờ TT" },
    cancelled: { badge: "var(--gray-100)", badgeText: "var(--gray-500)", border: "var(--gray-300)", label: "Đã huỷ" },
    refunded:  { badge: "var(--lavender)", badgeText: "#7C3AED", border: "#fb7185",  label: "Hoàn tiền" },
  };

  return (
    <div className="space-y-3">
      {data.map((inv) => {
        const style = STATUS_STYLE[inv.status] ?? STATUS_STYLE.cancelled;
        return (
          <div
            key={inv.id}
            className="rounded-2xl border-l-4 flex items-center justify-between gap-3 px-4 py-4"
            style={{
              background: "var(--white)",
              borderLeftColor: style.border,
              border: `1px solid var(--blush)`,
              borderLeft: `4px solid ${style.border}`,
              boxShadow: "0 2px 12px rgba(255,107,157,0.06)",
            }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-[var(--gray-500)] mb-0.5">
                #{inv.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-sm font-extrabold text-[var(--black)] myfit-number">
                {formatCurrency(inv.totalAmount)}
              </p>
              <p className="text-xs text-[var(--gray-500)] mt-0.5">{formatDate(inv.createdAt)}</p>
            </div>
            <span
              className="flex-shrink-0 rounded-full px-3 py-1 text-[10px] font-bold"
              style={{ background: style.badge, color: style.badgeText }}
            >
              {style.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HealthTab({ data, loading }: { data: ProgressResponse | null | undefined; loading: boolean }) {
  if (loading) return <Skeleton />;
  const logs = data?.weightLogs ?? [];
  if (logs.length === 0) return <Empty text="Chưa có dữ liệu cân nặng." />;

  const chartLogs = logs.slice(0, 8).reverse();
  const weights = chartLogs.map((w) => w.weightKg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const W = 280;
  const H = 80;
  const PAD = 8;
  const pts = weights.map((w, i) => {
    const x = PAD + (i / Math.max(weights.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - ((w - minW) / range) * (H - PAD * 2);
    return [x, y] as [number, number];
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const areaPath = [
    linePath,
    `L ${pts[pts.length - 1][0]} ${H}`,
    `L ${pts[0][0]} ${H}`,
    "Z",
  ].join(" ");

  const latestWeight = logs[0].weightKg;

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--blush)", boxShadow: "0 4px 24px rgba(255,107,157,0.1)" }}
      >
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, var(--pastel-pink) 0%, var(--blush) 100%)" }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--deep-pink)]" />
            <p className="text-sm font-bold text-[var(--black)]">Cân nặng gần đây</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold myfit-number text-[var(--deep-pink)]">{latestWeight}</span>
            <span className="text-xs font-medium text-[var(--gray-500)]">kg</span>
          </div>
        </div>

        <div className="bg-white px-4 pt-3 pb-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary-pink)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--primary-pink)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#chartGrad)" />
            <path d={linePath} fill="none" stroke="var(--primary-pink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map(([x, y], i) => (
              <circle
                key={i}
                cx={x} cy={y} r={i === pts.length - 1 ? 5 : 3}
                fill={i === pts.length - 1 ? "var(--deep-pink)" : "var(--primary-pink)"}
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </svg>
          <div className="flex justify-between text-[10px] text-[var(--gray-500)] mt-1 px-1">
            <span>{formatDateShort(chartLogs[0].measuredAt)}</span>
            <span>{formatDateShort(chartLogs[chartLogs.length - 1].measuredAt)}</span>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden divide-y"
        style={{ background: "var(--white)", border: "1px solid var(--blush)", boxShadow: "0 2px 12px rgba(255,107,157,0.06)" }}
      >
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--gray-100)" }}>
          <Activity className="h-3.5 w-3.5 text-[var(--primary-pink)]" />
          <span className="text-xs font-bold text-[var(--gray-500)] uppercase tracking-wider">Lịch sử đo</span>
          <span className="ml-auto text-xs text-[var(--gray-500)]">{logs.length} lần</span>
        </div>
        {logs.slice(0, 10).map((w) => (
          <div key={w.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[var(--gray-500)]">{formatDate(w.measuredAt)}</span>
            <span className="text-sm font-bold text-[var(--black)] myfit-number">{w.weightKg} kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MemberProfileHub() {
  const { authorizedRequest, session } = useAuth();
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

  const subData = subscriptionQuery.data ?? null;
  const totalCheckins = attendanceQuery.data?.length ?? 0;

  return (
    <div className="max-w-lg space-y-0">
      <div
        className="rounded-3xl overflow-hidden mb-5"
        style={{ border: "1px solid var(--blush)", boxShadow: "0 8px 40px rgba(255,107,157,0.13)" }}
      >
        <div
          className="h-24 w-full"
          style={{ background: "linear-gradient(135deg, var(--pastel-pink) 0%, var(--blush) 50%, var(--lavender) 100%)" }}
        />

        <div
          className="bg-white px-5 pb-5"
          style={{ paddingTop: 0 }}
        >
          <div className="flex items-end gap-4" style={{ marginTop: "-40px" }}>
            <div className="relative flex-shrink-0">
              <div
                className="h-20 w-20 rounded-full flex items-center justify-center ring-4 ring-white"
                style={{ background: "linear-gradient(135deg, var(--pastel-pink), var(--blush))", border: "2px solid var(--blush)" }}
              >
                <User className="h-9 w-9 text-[var(--primary-pink)]" />
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: "linear-gradient(135deg, var(--primary-pink), var(--deep-pink))", border: "2px solid white" }}
              >
                <Camera className="h-3 w-3 text-white" />
              </button>
            </div>

            <div className="pb-1 min-w-0 flex-1">
              <p className="text-base font-extrabold text-[var(--black)] truncate">
                {session?.userId ? `ID: ${session.userId.slice(0, 8)}` : "Thành viên"}
              </p>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold mt-0.5"
                style={{ background: "var(--pastel-pink)", color: "var(--deep-pink)" }}
              >
                {session?.role ?? "MEMBER"}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Lần điểm danh", value: totalCheckins, icon: Calendar },
              { label: "Gói tập", value: subData ? "Active" : "—", icon: Dumbbell },
              { label: "Còn lại", value: subData?.sessionsRemaining ?? "—", icon: Activity },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-2xl px-3 py-3 gap-1"
                style={{ background: "var(--pastel-pink)" }}
              >
                <Icon className="h-4 w-4 text-[var(--primary-pink)]" />
                <p className="text-base font-extrabold myfit-number text-[var(--black)] leading-none">{value}</p>
                <p className="text-[10px] font-medium text-[var(--gray-500)]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden mb-5"
        style={{ background: "var(--white)", border: "1px solid var(--blush)", boxShadow: "0 2px 12px rgba(255,107,157,0.06)" }}
      >
        <div className="myfit-tab-strip flex">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className="flex flex-1 flex-col items-center gap-1 px-2 py-3 text-xs font-semibold transition-all relative"
                style={{
                  color: isActive ? "var(--deep-pink)" : "var(--gray-500)",
                  background: isActive ? "rgba(255, 107, 157, 0.1)" : "transparent",
                }}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full"
                    style={{ width: "60%", height: 3, background: "linear-gradient(90deg, var(--primary-pink), var(--deep-pink))" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {activeTab === "checkins" && (
            <CheckInsTab data={attendanceQuery.data ?? []} loading={attendanceQuery.isLoading} />
          )}
          {activeTab === "subscription" && (
            <SubscriptionTab data={subscriptionQuery.data ?? null} loading={subscriptionQuery.isLoading} />
          )}
          {activeTab === "invoices" && (
            <InvoicesTab data={invoicesQuery.data ?? []} loading={invoicesQuery.isLoading} />
          )}
          {activeTab === "health" && (
            <HealthTab data={progressQuery.data} loading={progressQuery.isLoading} />
          )}
        </div>
      </div>
    </div>
  );
}
