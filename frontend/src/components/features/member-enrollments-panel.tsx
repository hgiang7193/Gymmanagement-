"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, Calendar, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

type Enrollment = {
  id: string;
  coursePackageId: string;
  status: string;
  enrolledAt: string;
  totalSessions: number;
  sessionsUsed: number;
};

type Attendance = {
  id: string;
  enrollmentId: string;
  shiftId: string;
  status: string;
  checkInTime: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: string }) {
  let cls = "";
  if (status === "ACTIVE") {
    cls = "bg-[var(--mint)] text-emerald-700";
  } else if (status === "COMPLETED" || status === "EXPIRED") {
    cls = "bg-slate-100 text-slate-600";
  } else {
    cls = "bg-amber-50 text-amber-700";
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="h-4 bg-slate-200 rounded w-2/3" />
      <div className="h-3 bg-slate-200 rounded w-1/3" />
      <div className="h-2 bg-slate-200 rounded w-full mt-2" />
    </div>
  );
}

export function MemberEnrollmentsPanel() {
  const { authorizedRequest } = useAuth();

  const enrollmentsQuery = useQuery({
    queryKey: ["member-enrollments"],
    queryFn: async () => {
      const response = await authorizedRequest<Enrollment[]>(
        "/api/v1/member/enrollments"
      );
      return response.data;
    },
  });

  const attendanceQuery = useQuery({
    queryKey: ["member-attendance"],
    queryFn: async () => {
      const response = await authorizedRequest<Attendance[]>(
        "/api/v1/member/attendance"
      );
      return response.data;
    },
  });

  if (enrollmentsQuery.isLoading || attendanceQuery.isLoading) {
    return (
      <div className="space-y-6 mt-6">
        <SurfaceCard title="Khoá học của tôi" description="Đang tải dữ liệu...">
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </SurfaceCard>
        <SurfaceCard title="Lịch sử điểm danh" description="Đang tải dữ liệu...">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse flex gap-3 items-center py-2 border-b border-slate-100 last:border-0"
              >
                <div className="h-5 w-5 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    );
  }

  if (enrollmentsQuery.isError || attendanceQuery.isError) {
    return (
      <div className="mt-6">
        <SurfaceCard title="Khoá học của tôi">
          <p className="text-sm text-rose-600">
            Không tải được dữ liệu khoá học.
          </p>
        </SurfaceCard>
      </div>
    );
  }

  const enrollments = enrollmentsQuery.data ?? [];
  const attendance = attendanceQuery.data ?? [];

  return (
    <div className="space-y-6 mt-6">
      {/* Enrollments section */}
      <SurfaceCard
        title="Khoá học của tôi"
        description="Danh sách khoá học đang hoạt động"
      >
        {enrollments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-[var(--gray-500)]">
            <BookOpen className="h-10 w-10 opacity-40" />
            <p className="text-sm">Bạn chưa đăng ký khoá học nào.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {enrollments.map((e) => {
              const isActive = e.status === "ACTIVE";
              const pct =
                e.totalSessions > 0
                  ? Math.min(
                      100,
                      Math.round((e.sessionsUsed / e.totalSessions) * 100)
                    )
                  : 0;
              return (
                <div
                  key={e.id}
                  className={`rounded-2xl border bg-white p-4 space-y-3 ${
                    isActive
                      ? "border-l-4 border-l-[var(--primary-pink)] border-slate-200"
                      : "border-slate-200"
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-[var(--gray-500)] mb-0.5">
                        Mã gói
                      </p>
                      <p className="font-semibold text-[var(--black)] text-sm leading-tight">
                        {e.coursePackageId}
                      </p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>

                  {/* Meta */}
                  <div className="space-y-1 text-xs text-[var(--gray-500)]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        <span className="font-medium text-[var(--black)]">
                          Ngày đăng ký:
                        </span>{" "}
                        {formatDate(e.enrolledAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        <span className="font-medium text-[var(--black)]">
                          Buổi học:
                        </span>{" "}
                        {e.sessionsUsed} / {e.totalSessions}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="h-2 rounded-full bg-[var(--blush)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background:
                            "linear-gradient(90deg, var(--primary-pink), var(--deep-pink))",
                        }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[10px] text-[var(--gray-500)]">
                      {pct}%
                    </p>
                  </div>

                  {/* Enrollment ID */}
                  <p className="text-[10px] text-slate-400 truncate">
                    Mã đăng ký: {e.id}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </SurfaceCard>

      {/* Attendance history section */}
      <SurfaceCard title="Lịch sử điểm danh">
        {attendance.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-[var(--gray-500)]">
            <BookOpen className="h-10 w-10 opacity-40" />
            <p className="text-sm">Chưa có lịch sử điểm danh.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {attendance.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[var(--pastel-pink)] transition-colors"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--black)] truncate">
                    <span className="text-[var(--gray-500)] font-normal">
                      Ca tập:
                    </span>{" "}
                    {a.shiftId.slice(0, 8)}
                  </p>
                  <p className="text-xs text-[var(--gray-500)] truncate">
                    <span className="font-medium text-[var(--black)]">
                      Trạng thái:
                    </span>{" "}
                    {a.status}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[var(--gray-500)]">
                    {formatDateTime(a.checkInTime)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
