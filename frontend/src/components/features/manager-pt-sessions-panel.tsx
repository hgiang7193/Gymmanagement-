"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation } from "@tanstack/react-query";

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
      alert("Dat lich tap PT thanh cong!");
      setMemberId("");
      setTrainerId("");
      setScheduledAt("");
    },
    onError: (err: Error) => {
      alert("Loi dat lich: " + err.message);
    }
  });

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    bookMutation.mutate({ memberId, trainerId, scheduledAt });
  };

  return (
    <div className="space-y-6 mt-6">
      <SurfaceCard title="Book PT Session" description="Dat lich tap cho hoi vien co PT Package dang hoat dong">
        <form onSubmit={handleBook} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Member ID</label>
              <input type="text" required value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Trainer ID (Coach)</label>
              <input type="text" required value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Time (ISO Date/Time)</label>
              <input type="datetime-local" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
              <p className="mt-1 text-xs text-slate-500">Vi du: chon ngay va gio du kien tap.</p>
            </div>
          </div>
          <button type="submit" disabled={bookMutation.isPending} className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
            {bookMutation.isPending ? "Dang xu ly..." : "Book Session"}
          </button>
        </form>
      </SurfaceCard>
    </div>
  );
}
