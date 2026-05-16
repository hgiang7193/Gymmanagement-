"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, ClipboardList, Loader2 } from "lucide-react";

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
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(val),
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
    <SurfaceCard
      title="Danh sách ca tập"
      description="Danh sách hội viên đã điểm danh trong ca."
    >
      {/* Search form */}
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          setShiftId(inputShiftId);
        }}
        className="mb-5 flex gap-3"
      >
        <input
          value={inputShiftId}
          onChange={(e) => setInputShiftId(e.target.value)}
          placeholder="Nhập mã ca tập..."
          className="myfit-input flex-1"
        />
        <button
          type="submit"
          className="inline-flex h-[52px] items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 font-semibold text-white"
        >
          Xem danh sách
        </button>
      </form>

      {/* Loading */}
      {query.isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      )}

      {/* Error */}
      {query.isError && (
        <p className="text-sm text-rose-500">Không tải được danh sách ca tập.</p>
      )}

      {/* Empty state (no shiftId entered yet) */}
      {!shiftId && !query.isLoading && (
        <div className="flex flex-col items-center gap-3 py-10 text-[var(--gray-500)]">
          <ClipboardList className="h-10 w-10 text-[var(--gray-300)]" />
          <p className="text-sm">Nhập mã ca tập để xem danh sách điểm danh</p>
        </div>
      )}

      {/* Roster results */}
      {query.data && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-lg bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700">
              {query.data.shift.shiftCode}
            </span>
            <span className="text-sm text-[var(--gray-500)]">
              {formatTime(query.data.shift.startAt)}–{formatTime(query.data.shift.endAt)}
            </span>
            <span className="ml-auto text-sm font-medium text-[var(--black)]">
              <strong>{query.data.totalCheckins}</strong> học viên
            </span>
          </div>

          <div className="divide-y divide-[var(--blush)]">
            {query.data.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                {/* Left: name + email */}
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--black)]">
                    {m.memberName || m.memberEmail}
                  </p>
                  {m.memberName && (
                    <p className="truncate text-xs text-[var(--gray-500)]">{m.memberEmail}</p>
                  )}
                </div>

                {/* Right: badges */}
                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <span className="rounded-lg bg-[var(--pastel-pink)] px-2.5 py-1 text-xs font-medium text-[var(--deep-pink)]">
                    {formatTime(m.checkInTime)}
                  </span>
                  {m.sessionsRemaining != null && (
                    <span className="rounded-lg bg-[var(--mint)] px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {m.sessionsRemaining} buổi
                    </span>
                  )}
                  {m.proxyCheckin && (
                    <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                      Can thiệp
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SurfaceCard>
  );
}

function OverrideCheckInForm() {
  const { authorizedRequest, session } = useAuth();
  const [userId, setUserId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const branchId = session?.branchIds?.[0] ?? "";
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await authorizedRequest("/api/v1/manager/check-ins/override", {
        method: "POST",
        body: JSON.stringify({ userId, shiftId, branchId, reason }),
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Điểm danh bổ sung thành công. Nhật ký đã được ghi.");
      setUserId("");
      setShiftId("");
      setReason("");
    },
    onError: (err: Error) => {
      const map: Record<string, string> = {
        DUPLICATE_CHECKIN: "Hội viên đã điểm danh ca này rồi",
        NO_ACTIVE_ENROLLMENT: "Hội viên chưa có gói tập đang hoạt động",
        SHIFT_GRACE_PERIOD_EXPIRED:
          "Đã quá thời gian cho phép can thiệp (60 phút sau ca kết thúc)",
        OVERRIDE_REASON_REQUIRED: "Vui lòng nhập lý do can thiệp",
      };
      toast.error(map[err.message] ?? err.message);
    },
  });

  return (
    <div className="space-y-0">
      {/* Gradient banner */}
      <div className="flex h-16 items-center gap-4 rounded-t-3xl bg-gradient-to-r from-rose-500 to-pink-600 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
          <AlertCircle className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-white">Điểm danh bổ sung (can thiệp)</p>
          <p className="text-xs text-white/80">Mọi thao tác đều được ghi nhật ký</p>
        </div>
      </div>

      <div className="myfit-surface rounded-t-none rounded-b-3xl p-6">
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {/* userId */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--black)]">
                Mã hội viên <span className="text-[var(--primary-pink)]">*</span>
              </label>
              <input
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="myfit-input"
                placeholder="Nhập User ID..."
              />
            </div>

            {/* shiftId */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--black)]">
                Mã ca tập <span className="text-[var(--primary-pink)]">*</span>
              </label>
              <input
                required
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="myfit-input"
                placeholder="Nhập mã ca tập..."
              />
            </div>

            {/* reason */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-[var(--black)]">
                Lý do can thiệp <span className="text-[var(--primary-pink)]">*</span>
              </label>
              <input
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: App bị lỗi, cân InBody mất kết nối..."
                className="myfit-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                Điểm danh bổ sung
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export function ManagerCheckInsPanel() {
  return (
    <div className="mt-6 space-y-6">
      <RosterViewer />
      <OverrideCheckInForm />
    </div>
  );
}
