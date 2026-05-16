"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dumbbell, Loader2 } from "lucide-react";

type BookPtSessionInput = {
  memberId: string;
  trainerId: string;
  scheduledAt: string;
};

export function ManagerPtSessionsPanel() {
  const { authorizedRequest } = useAuth();

  const [memberId, setMemberId] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const bookMutation = useMutation({
    mutationFn: async (data: BookPtSessionInput) => {
      return authorizedRequest("/api/v1/manager/pt-sessions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Đặt lịch tập PT thành công!");
      setMemberId("");
      setTrainerId("");
      setScheduledAt("");
    },
    onError: (err: Error) => {
      toast.error("Lỗi đặt lịch: " + err.message);
    },
  });

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    bookMutation.mutate({ memberId, trainerId, scheduledAt });
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Gradient banner */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-500 h-20 rounded-3xl flex items-center gap-4 px-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/20">
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-white text-xl font-bold tracking-tight">Quản lý lịch PT</h1>
      </div>

      {/* Form card */}
      <SurfaceCard title="Đặt lịch tập PT" description="Đặt lịch tập cho hội viên có gói PT đang hoạt động">
        <form onSubmit={handleBook} className="space-y-4">
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
                Mã huấn luyện viên
              </label>
              <input
                type="text"
                required
                value={trainerId}
                onChange={(e) => setTrainerId(e.target.value)}
                className="myfit-input w-full"
                placeholder="Nhập mã huấn luyện viên"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[var(--black)] mb-1">
                Thời gian tập
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="myfit-input w-full"
              />
              <p className="mt-1 text-xs text-[var(--gray-500)]">
                Ví dụ: chọn ngày và giờ dự kiến tập.
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={bookMutation.isPending}
            className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-2xl h-12 px-6 flex items-center gap-2 transition-transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {bookMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Đặt lịch"
            )}
          </button>
        </form>
      </SurfaceCard>
    </div>
  );
}
