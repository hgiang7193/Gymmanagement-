"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { GraduationCap, Loader2 } from "lucide-react";

type EnrollInput = {
  memberId: string;
  coursePackageId: string;
};

export function ManagerCourseEnrollmentsPanel() {
  const { authorizedRequest } = useAuth();

  const [memberId, setMemberId] = useState("");
  const [coursePackageId, setCoursePackageId] = useState("");

  const enrollMutation = useMutation({
    mutationFn: async (data: EnrollInput) => {
      return authorizedRequest("/api/v1/manager/course-enrollments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Ghi danh khoá học thành công!");
      setMemberId("");
      setCoursePackageId("");
    },
    onError: (err: Error) => {
      toast.error("Lỗi ghi danh: " + err.message);
    },
  });

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    enrollMutation.mutate({ memberId, coursePackageId });
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Gradient banner */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-500 h-20 rounded-3xl flex items-center gap-4 px-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/20">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-white text-xl font-bold tracking-tight">Ghi danh khoá học</h1>
      </div>

      {/* Form card */}
      <SurfaceCard title="Ghi danh khoá học" description="Đăng ký gói khoá học cho hội viên">
        <form onSubmit={handleEnroll} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[var(--black)] mb-1">
                Mã hội viên
              </label>
              <input
                type="text"
                required
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="myfit-input w-full"
                placeholder="Nhập mã hội viên"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--black)] mb-1">
                Mã gói khoá học
              </label>
              <input
                type="text"
                required
                value={coursePackageId}
                onChange={(e) => setCoursePackageId(e.target.value)}
                className="myfit-input w-full"
                placeholder="Nhập mã gói khoá học"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={enrollMutation.isPending}
            className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-2xl h-12 px-6 flex items-center gap-2 transition-transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {enrollMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Ghi danh"
            )}
          </button>
        </form>
      </SurfaceCard>
    </div>
  );
}
