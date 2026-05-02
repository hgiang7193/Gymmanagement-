"use client";

import { FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";

type Shift = {
  id: string;
  shiftCode: string;
  date: string;
  startAt: string;
  endAt: string;
  totalCheckins: number;
  alreadyCheckedIn: boolean;
  branchId: string;
};

function formatTime(val: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(val));
}

function ShiftCard({ shift, onCheckIn }: { shift: Shift; onCheckIn: (shift: Shift) => void }) {
  return (
    <div className={`rounded-2xl border p-4 flex items-center justify-between gap-4 ${shift.alreadyCheckedIn ? "bg-green-50 border-green-200" : "bg-white border-slate-200"}`}>
      <div>
        <p className="font-semibold text-slate-800">{shift.shiftCode}</p>
        <p className="text-sm text-slate-500">{formatTime(shift.startAt)} – {formatTime(shift.endAt)}</p>
        <p className="text-xs text-slate-400">{shift.totalCheckins} người đã check-in</p>
      </div>
      {shift.alreadyCheckedIn ? (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Đã check-in</span>
      ) : (
        <button
          onClick={() => onCheckIn(shift)}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition"
        >
          Check-in
        </button>
      )}
    </div>
  );
}

function CheckInModal({
  shift,
  onClose,
  onConfirm,
  loading,
}: {
  shift: Shift;
  onClose: () => void;
  onConfirm: (weightKg: number, source: string) => void;
  loading: boolean;
}) {
  const [weight, setWeight] = useState("");
  const [source, setSource] = useState("manual");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || w <= 0 || w > 300) {
      toast.error("Vui lòng nhập cân nặng hợp lệ (kg)");
      return;
    }
    onConfirm(w, source);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Check-in ca tập</h2>
        <p className="text-sm text-slate-500 mb-4">{shift.shiftCode} · {formatTime(shift.startAt)} – {formatTime(shift.endAt)}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-800">Cân nặng (kg) *</span>
            <input
              required
              type="number"
              min="20"
              max="300"
              step="0.1"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-400"
              placeholder="Ví dụ: 65.5"
              autoFocus
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-800">Nguồn đo</span>
            <select
              value={source}
              onChange={e => setSource(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-400"
            >
              <option value="manual">Nhập tay</option>
              <option value="inbody">Cân InBody</option>
            </select>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Huỷ
            </button>
            <button
              disabled={loading}
              type="submit"
              className="flex-1 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:bg-slate-400 transition"
            >
              {loading ? "Đang lưu..." : "Lưu & Check-in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MemberCheckInPanel() {
  const { authorizedRequest, session } = useAuth();
  const queryClient = useQueryClient();
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Get branch from session (first branch or query param)
  const branchId = session?.branchIds?.[0];

  const shiftsQuery = useQuery({
    queryKey: ["member-available-shifts", branchId],
    queryFn: async () => {
      if (!branchId) return [];
      const res = await authorizedRequest<Shift[]>(`/api/v1/member/shifts/available?branch_id=${branchId}`);
      return res.data ?? [];
    },
    refetchInterval: 30_000,
    enabled: !!branchId,
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ shiftId, weightKg, measurementSource }: { shiftId: string; weightKg: number; measurementSource: string }) => {
      const res = await authorizedRequest<unknown>("/api/v1/member/check-in", {
        method: "POST",
        body: JSON.stringify({ shiftId, branchId, weightKg, measurementSource }),
      });
      return res.data;
    },
    onSuccess: (data: unknown) => {
      toast.success("Check-in thành công!");
      setSelectedShift(null);
      queryClient.invalidateQueries({ queryKey: ["member-available-shifts"] });
      const d = data as { sessionsRemaining?: number };
      if (d?.sessionsRemaining !== undefined) {
        toast.info(`Còn lại ${d.sessionsRemaining} buổi tập`);
      }
    },
    onError: (err: Error) => {
      const map: Record<string, string> = {
        WEIGHT_REQUIRED: "Vui lòng nhập cân nặng để hoàn tất check-in",
        DUPLICATE_CHECKIN: "Bạn đã check-in ca này rồi",
        SHIFT_NOT_STARTED: "Ca chưa mở cửa sổ check-in (chờ 30 phút trước giờ bắt đầu)",
        SHIFT_ALREADY_ENDED: "Ca đã kết thúc, không thể check-in",
        NO_ACTIVE_ENROLLMENT: "Bạn chưa có gói tập đang hoạt động",
        NO_SESSIONS_REMAINING: "Bạn đã hết buổi tập. Vui lòng gia hạn gói.",
      };
      toast.error(map[err.message] ?? err.message);
    },
  });

  function handleConfirm(weightKg: number, measurementSource: string) {
    if (!selectedShift) return;
    checkInMutation.mutate({ shiftId: selectedShift.id, weightKg, measurementSource });
  }

  return (
    <AppShell role="MEMBER" title="Check-in ca tập" description="Chọn ca và nhập cân nặng để check-in.">
      <ScreenIntro
        eyebrow="Member"
        title="Check-in ca tập hôm nay"
        body="Chọn ca đang mở, nhập cân nặng. Check-in và lưu sinh trắc được thực hiện đồng thời."
      />

      {!branchId ? (
        <SurfaceCard title="Chưa có chi nhánh">
          <p className="text-sm text-slate-600">Tài khoản của bạn chưa được gán chi nhánh. Liên hệ quản lý để được hỗ trợ.</p>
        </SurfaceCard>
      ) : shiftsQuery.isLoading ? (
        <p className="text-sm text-slate-500">Đang tải danh sách ca...</p>
      ) : shiftsQuery.isError ? (
        <p className="text-sm text-rose-600">Không tải được danh sách ca. Thử lại sau.</p>
      ) : (shiftsQuery.data ?? []).length === 0 ? (
        <SurfaceCard title="Không có ca check-in">
          <p className="text-sm text-slate-600">Hiện không có ca nào trong cửa sổ check-in (30 phút trước đến khi kết thúc ca).</p>
        </SurfaceCard>
      ) : (
        <div className="space-y-3 max-w-lg">
          {(shiftsQuery.data ?? []).map(shift => (
            <ShiftCard key={shift.id} shift={shift} onCheckIn={setSelectedShift} />
          ))}
        </div>
      )}

      {selectedShift && (
        <CheckInModal
          shift={selectedShift}
          onClose={() => setSelectedShift(null)}
          onConfirm={handleConfirm}
          loading={checkInMutation.isPending}
        />
      )}
    </AppShell>
  );
}
