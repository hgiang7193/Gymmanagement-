"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

type RosterMember = {
  id: string;
  userId: string;
  memberName: string;
  memberEmail: string;
  checkInTime: string;
  status: string;
  proxyCheckin: boolean;
  sessionsRemaining?: number;
};

type RosterData = {
  shift: { id: string; shiftCode: string; date: string; startAt: string; endAt: string };
  totalCheckins: number;
  members: RosterMember[];
};

function formatTime(val: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(val));
}

function OverrideCheckInForm() {
  const { authorizedRequest, session } = useAuth();
  const [userId, setUserId]   = useState("");
  const [shiftId, setShiftId] = useState("");
  const [branchId, setBranchId] = useState(session?.branchIds?.[0] ?? "");
  const [reason, setReason]   = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await authorizedRequest("/api/v1/manager/check-ins/override", {
        method: "POST",
        body: JSON.stringify({ userId, shiftId, branchId, reason }),
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Override check-in thành công. Audit log đã được ghi.");
      setUserId(""); setShiftId(""); setReason("");
    },
    onError: (err: Error) => {
      const map: Record<string, string> = {
        DUPLICATE_CHECKIN: "Member đã check-in ca này rồi",
        NO_ACTIVE_ENROLLMENT: "Member chưa có gói tập đang hoạt động",
        SHIFT_GRACE_PERIOD_EXPIRED: "Đã quá thời gian cho phép override (60 phút sau ca kết thúc)",
        OVERRIDE_REASON_REQUIRED: "Vui lòng nhập lý do override",
      };
      toast.error(map[err.message] ?? err.message);
    },
  });

  return (
    <SurfaceCard title="Override check-in" description="UC-MGR-04: Can thiệp khi member không tự check-in được. Mọi thao tác đều được ghi audit log.">
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">User ID (Member) *</span>
            <input required value={userId} onChange={e => setUserId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Shift ID *</span>
            <input required value={shiftId} onChange={e => setShiftId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </label>
          <label className="block space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Lý do override * (bắt buộc)</span>
            <input required value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Ví dụ: App bị lỗi, cân InBody mất kết nối..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </label>
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-slate-400 transition"
        >
          {mutation.isPending ? "Đang xử lý..." : "Override check-in"}
        </button>
      </form>
    </SurfaceCard>
  );
}

function RosterViewer() {
  const { authorizedRequest } = useAuth();
  const [inputShiftId, setInputShiftId] = useState("");
  const [shiftId, setShiftId] = useState("");

  const query = useQuery({
    queryKey: ["shift-roster", shiftId],
    queryFn: async () => {
      const res = await authorizedRequest<RosterData>(`/api/v1/shifts/${shiftId}/roster`);
      return res.data;
    },
    enabled: !!shiftId,
  });

  return (
    <SurfaceCard title="Xem roster ca" description="UC-MGR-02: Danh sách học viên đã check-in trong ca.">
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); setShiftId(inputShiftId); }} className="flex gap-3 mb-4">
        <input
          value={inputShiftId}
          onChange={e => setInputShiftId(e.target.value)}
          placeholder="Nhập Shift ID..."
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
        />
        <button type="submit" className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Xem roster
        </button>
      </form>

      {query.isLoading && <p className="text-sm text-slate-500">Đang tải...</p>}
      {query.isError && <p className="text-sm text-rose-600">Không tải được roster.</p>}
      {query.data && (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">
            {query.data.shift.shiftCode} · {formatTime(query.data.shift.startAt)}–{formatTime(query.data.shift.endAt)} · <strong>{query.data.totalCheckins}</strong> học viên
          </p>
          <div className="divide-y divide-slate-100">
            {query.data.members.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{m.memberName || m.memberEmail}</p>
                  <p className="text-xs text-slate-400">{formatTime(m.checkInTime)}{m.proxyCheckin ? " · override" : ""}</p>
                </div>
                {m.sessionsRemaining != null && (
                  <span className="text-xs text-slate-500">{m.sessionsRemaining} buổi còn lại</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </SurfaceCard>
  );
}

export function ManagerCheckInsPanel() {
  return (
    <div className="space-y-6 mt-6">
      <RosterViewer />
      <OverrideCheckInForm />
    </div>
  );
}
