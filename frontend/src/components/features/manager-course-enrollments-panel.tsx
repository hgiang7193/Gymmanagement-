"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation } from "@tanstack/react-query";

export function ManagerCourseEnrollmentsPanel() {
  const { authorizedRequest } = useAuth();
  
  const [memberId, setMemberId] = useState("");
  const [coursePackageId, setCoursePackageId] = useState("");

  const enrollMutation = useMutation({
    mutationFn: async (data: any) => {
      return authorizedRequest("/api/v1/manager/course-enrollments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      alert("Ghi danh khoa hoc thanh cong!");
      setMemberId("");
      setCoursePackageId("");
    },
    onError: (err: any) => {
      alert("Loi ghi danh: " + err.message);
    }
  });

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    enrollMutation.mutate({ memberId, coursePackageId });
  };

  return (
    <div className="space-y-6 mt-6">
      <SurfaceCard title="Enroll in Course" description="Dang ky course package cho hoi vien">
        <form onSubmit={handleEnroll} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Member ID</label>
              <input type="text" required value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Course Package ID</label>
              <input type="text" required value={coursePackageId} onChange={(e) => setCoursePackageId(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
            </div>
          </div>
          <button type="submit" disabled={enrollMutation.isPending} className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
            {enrollMutation.isPending ? "Dang xu ly..." : "Enroll Member"}
          </button>
        </form>
      </SurfaceCard>
    </div>
  );
}
