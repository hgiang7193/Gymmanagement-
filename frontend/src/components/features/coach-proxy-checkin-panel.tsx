"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

const ERROR_MESSAGES: Record<string, string> = {
  COACH_NOT_ASSIGNED_TO_SHIFT: "Bạn chưa được phân công ca này.",
  SHIFT_NOT_STARTED: "Ca chưa mở cửa sổ check-in.",
  SHIFT_ALREADY_ENDED: "Ca đã kết thúc — đề nghị Manager xử lý.",
  DUPLICATE_CHECKIN: "Học viên đã check-in ca này.",
  OVERRIDE_REASON_REQUIRED: "Bắt buộc nhập lý do khi proxy check-in.",
  WEIGHT_REQUIRED: "Vui lòng nhập cân nặng.",
  NO_ACTIVE_ENROLLMENT: "Học viên không có gói/khoá học active.",
  NO_SESSIONS_REMAINING: "Học viên đã hết số buổi.",
};

function humanError(error: unknown) {
  const code = error instanceof Error ? error.message : String(error);
  return ERROR_MESSAGES[code] ?? code;
}

export function CoachProxyCheckInPanel() {
  const { authorizedRequest } = useAuth();
  const [form, setForm] = useState({
    shiftId: "",
    branchId: "",
    memberUserId: "",
    weightKg: "",
    reason: "",
  });

  const proxyMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      if (!payload.reason.trim()) throw new Error("OVERRIDE_REASON_REQUIRED");
      if (!payload.weightKg) throw new Error("WEIGHT_REQUIRED");
      const response = await authorizedRequest("/api/v1/coach/check-ins/proxy", {
        method: "POST",
        body: JSON.stringify({
          shiftId: payload.shiftId,
          branchId: payload.branchId,
          memberUserId: payload.memberUserId,
          weightKg: Number(payload.weightKg),
          overrideReason: payload.reason,
        }),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Đã proxy check-in cho học viên.");
      setForm({ shiftId: "", branchId: "", memberUserId: "", weightKg: "", reason: "" });
    },
    onError: (error) => toast.error(humanError(error)),
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    proxyMutation.mutate(form);
  }

  return (
    <SurfaceCard
      title="Hỗ trợ check-in học viên"
      description="Khi học viên có mặt nhưng không tự check-in được. Mọi thao tác đều ghi audit và gắn cờ proxy_checkin."
    >
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Shift ID</label>
            <input
              value={form.shiftId}
              onChange={(e) => setForm({ ...form, shiftId: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="shift-..."
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Branch ID</label>
            <input
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="branch-..."
              required
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Member user ID</label>
          <input
            value={form.memberUserId}
            onChange={(e) => setForm({ ...form, memberUserId: e.target.value })}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
            placeholder="user-..."
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Cân nặng (kg)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={form.weightKg}
            onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
            placeholder="65.5"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-rose-600">Lý do (bắt buộc)</label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-rose-300 px-3 py-2 text-sm"
            placeholder="Ví dụ: cân hỏng, app member lỗi, đã xác minh danh tính..."
            required
          />
        </div>
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
          ⚠️ Hành động này được ghi vào audit log với <code>override_actor=coach</code>. Hãy chắc chắn bạn đã xác minh
          danh tính học viên trước khi xác nhận.
        </div>
        <button
          type="submit"
          disabled={proxyMutation.isPending}
          className="rounded-2xl bg-rose-600 px-5 py-3 font-semibold text-white disabled:bg-rose-300"
        >
          {proxyMutation.isPending ? "Đang xử lý..." : "Xác nhận proxy check-in"}
        </button>
      </form>
    </SurfaceCard>
  );
}
