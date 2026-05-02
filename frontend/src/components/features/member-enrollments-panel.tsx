"use client";

import { useQuery } from "@tanstack/react-query";
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
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function MemberEnrollmentsPanel() {
  const { authorizedRequest } = useAuth();
  
  const enrollmentsQuery = useQuery({
    queryKey: ["member-enrollments"],
    queryFn: async () => {
      const response = await authorizedRequest<Enrollment[]>("/api/v1/member/enrollments");
      return response.data;
    },
  });

  const attendanceQuery = useQuery({
    queryKey: ["member-attendance"],
    queryFn: async () => {
      const response = await authorizedRequest<Attendance[]>("/api/v1/member/attendance");
      return response.data;
    },
  });

  if (enrollmentsQuery.isLoading || attendanceQuery.isLoading) {
    return <p className="text-sm text-slate-600">Dang tai du lieu...</p>;
  }

  if (enrollmentsQuery.isError || attendanceQuery.isError) {
    return <p className="text-sm text-rose-600">Khong tai duoc du lieu khoa hoc.</p>;
  }

  const enrollments = enrollmentsQuery.data || [];
  const attendance = attendanceQuery.data || [];

  return (
    <div className="space-y-6 mt-6">
      <SurfaceCard title="My Course Enrollments" description="Danh sach khoa hoc dang hoat dong">
        {enrollments.length === 0 ? (
          <p className="text-sm text-slate-600">Ban chua dang ky khoa hoc nao.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {enrollments.map((e) => (
              <div key={e.id} className="border rounded-xl p-4 bg-slate-50">
                <div className="font-medium text-lg mb-1">{e.coursePackageId}</div>
                <div className="text-sm text-slate-500 mb-2">Status: <span className="font-medium text-slate-700">{e.status}</span></div>
                <div className="text-sm">
                  <div>Enrolled: {formatDate(e.enrolledAt)}</div>
                  <div className="mt-2">
                    <span className="text-slate-500">Sessions: </span> 
                    <span className="font-medium">{e.sessionsUsed} / {e.totalSessions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard title="Class Attendance" description="Lich su diem danh lop hoc">
        {attendance.length === 0 ? (
          <p className="text-sm text-slate-600">Chua co lich su diem danh.</p>
        ) : (
          <div className="space-y-3">
            {attendance.map((a) => (
              <div key={a.id} className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <div className="font-medium">Shift ID: {a.shiftId}</div>
                  <div className="text-xs text-slate-500">Enrollment: {a.enrollmentId}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">{formatDate(a.checkInTime)}</div>
                  <div className="text-xs font-medium uppercase text-emerald-600">{a.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
