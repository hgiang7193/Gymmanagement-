"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

type Review = {
  id: string;
  reviewerId: string;
  targetType: string;
  targetId: string;
  rating: number;
  comment: string | null;
  status: "visible" | "flagged" | "hidden" | string;
  branchId: string | null;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  flagged: "Bị gắn cờ",
  visible: "Hiển thị",
  hidden: "Đã ẩn",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  shift: "Ca tập",
  coach: "Huấn luyện viên",
  equipment: "Thiết bị",
  exercise: "Bài tập",
};

const STATUS_FILTERS = ["flagged", "visible", "hidden"] as const;

const STATUS_BADGE: Record<string, string> = {
  flagged: "bg-rose-100 text-rose-800",
  visible: "bg-emerald-100 text-emerald-800",
  hidden: "bg-slate-200 text-slate-700",
};

export function ManagerReviewsModerationPanel() {
  const queryClient = useQueryClient();
  const { authorizedRequest } = useAuth();
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>("flagged");
  const [moderating, setModerating] = useState<{ reviewId: string; status: string; reason: string } | null>(null);

  const reviewsQuery = useQuery({
    queryKey: ["manager-reviews", filter],
    queryFn: async () =>
      (await authorizedRequest<Review[]>(`/api/v1/manager/reviews?status=${filter}`)).data,
  });

  const moderateMutation = useMutation({
    mutationFn: async (payload: { reviewId: string; status: string; reason: string }) => {
      if (!payload.reason.trim()) throw new Error("REASON_REQUIRED");
      const response = await authorizedRequest<Review>(
        `/api/v1/manager/reviews/${payload.reviewId}/status`,
        { method: "PATCH", body: JSON.stringify({ status: payload.status, reason: payload.reason }) },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái review");
      setModerating(null);
      void queryClient.invalidateQueries({ queryKey: ["manager-reviews"] });
    },
    onError: (error) => {
      const code = error instanceof Error ? error.message : String(error);
      if (code === "REASON_REQUIRED") {
        toast.error("Vui lòng nhập lý do trước khi đổi trạng thái.");
      } else {
        toast.error(code);
      }
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-slate-700">Lọc trạng thái:</span>
        <div className="myfit-tab-bar">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`myfit-tab-pill rounded-full px-3 py-1.5 ${
                filter === s ? "myfit-tab-pill--active" : "myfit-tab-pill--ghost"
              }`}
            >
              {STATUS_LABELS[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      {reviewsQuery.isLoading ? <p className="text-sm text-slate-600">Đang tải...</p> : null}
      {reviewsQuery.isError ? <p className="text-sm text-rose-600">Không tải được danh sách review.</p> : null}

      {(reviewsQuery.data ?? []).length === 0 ? (
        <p className="text-sm text-slate-500">Không có đánh giá nào ở trạng thái &ldquo;{STATUS_LABELS[filter] ?? filter}&rdquo;.</p>
      ) : null}

      <div className="space-y-3">
        {(reviewsQuery.data ?? []).map((r) => (
          <SurfaceCard
            key={r.id}
            title={`★ ${r.rating}/5 · ${TARGET_TYPE_LABELS[r.targetType] ?? r.targetType}`}
            description={`Người đánh giá: ${(r.reviewerId ?? "").slice(0, 8)}… · Đối tượng: ${r.targetId.slice(0, 16)}…`}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[r.status] ?? "bg-slate-100 text-slate-700"}`}>
                  {STATUS_LABELS[r.status] ?? r.status}
                </span>
                <span className="text-xs text-slate-500">
                  {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(r.createdAt))}
                </span>
              </div>
              {r.comment ? <p className="text-sm text-slate-800">{r.comment}</p> : <p className="text-sm italic text-slate-500">(không có comment)</p>}

              {moderating?.reviewId === r.id ? (
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <select
                    value={moderating.status}
                    onChange={(e) => setModerating({ ...moderating, status: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="visible">Hiển thị</option>
                    <option value="flagged">Gắn cờ</option>
                    <option value="hidden">Ẩn</option>
                  </select>
                  <textarea
                    value={moderating.reason}
                    onChange={(e) => setModerating({ ...moderating, reason: e.target.value })}
                    placeholder="Lý do bắt buộc..."
                    rows={2}
                    className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => moderateMutation.mutate(moderating)}
                      disabled={moderateMutation.isPending}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:bg-emerald-300"
                    >
                      Xác nhận
                    </button>
                    <button
                      type="button"
                      onClick={() => setModerating(null)}
                      className="rounded-2xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModerating({ reviewId: r.id, status: r.status === "hidden" ? "visible" : "hidden", reason: "" })}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Đổi trạng thái
                  </button>
                </div>
              )}
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
