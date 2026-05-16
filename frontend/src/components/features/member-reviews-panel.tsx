"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";

type Review = {
  id: string;
  targetType: string;
  targetId: string;
  rating: number;
  comment: string | null;
  status: string;
  createdAt: string;
};

const TARGET_LABELS: Record<string, string> = {
  shift: "Ca tập",
  coach: "Huấn luyện viên",
  equipment: "Thiết bị",
  exercise: "Bài tập",
};

const statusBadgeClass: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border border-rose-200",
  HIDDEN: "bg-rose-50 text-rose-700 border border-rose-200",
};

const statusLabel: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  HIDDEN: "Đã ẩn",
};

function ReviewStatusBadge({ status }: { status: string }) {
  const cls = statusBadgeClass[status] ?? "bg-slate-100 text-slate-600 border border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {statusLabel[status] ?? status}
    </span>
  );
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`transition-transform ${onChange ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <Star
            className={`h-6 w-6 ${star <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

function SubmitReviewForm({ onSuccess }: { onSuccess: () => void }) {
  const { authorizedRequest } = useAuth();
  const [targetType, setTargetType] = useState("shift");
  const [targetId, setTargetId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await authorizedRequest("/api/v1/member/reviews", {
        method: "POST",
        body: JSON.stringify({ targetType, targetId, rating, comment: comment || null }),
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Đánh giá đã được gửi!");
      setTargetId("");
      setComment("");
      setRating(5);
      onSuccess();
    },
    onError: (err: Error) => {
      const map: Record<string, string> = {
        REVIEW_REQUIRES_ATTENDANCE: "Bạn phải tham dự ca này để đánh giá",
        REVIEW_ALREADY_SUBMITTED: "Bạn đã đánh giá ca này rồi",
        REVIEW_RATE_LIMIT_EXCEEDED: "Bạn đã gửi quá nhiều đánh giá hôm nay",
        INVALID_REVIEW_RATING: "Điểm đánh giá phải từ 1 đến 5",
      };
      toast.error(map[err.message] ?? err.message);
    },
  });

  return (
    <SurfaceCard
      title="Gửi đánh giá"
      description="Chọn loại đối tượng (ca, HLV, thiết bị, bài tập). Bạn cần có tương tác hợp lệ với đối tượng đó."
    >
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Đối tượng đánh giá *</span>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="myfit-input w-full"
            >
              {Object.entries(TARGET_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">ID đối tượng *</span>
            <input
              required
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder={`Nhập ${TARGET_LABELS[targetType]} ID...`}
              className="myfit-input w-full"
            />
            <span className="text-xs text-slate-400">
              Lấy ID từ lịch sử ca tập, danh sách HLV hoặc thiết bị.
            </span>
          </label>

          <div className="block space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700 block mb-2">Điểm đánh giá *</span>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <label className="block space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Nhận xét (tuỳ chọn)</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              className="myfit-input w-full"
              style={{ height: "auto", minHeight: "88px", paddingTop: "12px", resize: "none" }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="myfit-btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm"
        >
          {mutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
        </button>
      </form>
    </SurfaceCard>
  );
}

function MyReviews() {
  const { authorizedRequest } = useAuth();
  const query = useQuery({
    queryKey: ["my-reviews"],
    queryFn: async () => {
      const res = await authorizedRequest<Review[]>("/api/v1/member/reviews");
      return res.data ?? [];
    },
  });

  if (query.isLoading) return <p className="text-sm text-slate-500">Đang tải đánh giá...</p>;
  if (query.isError) return <p className="text-sm text-rose-600">Không tải được đánh giá.</p>;
  const reviews = query.data ?? [];

  return (
    <SurfaceCard title="Đánh giá của tôi" description="Lịch sử đánh giá đã gửi.">
      {reviews.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có đánh giá nào.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {reviews.map((r) => (
            <div key={r.id} className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-semibold text-slate-800 truncate">
                    {TARGET_LABELS[r.targetType] ?? r.targetType}
                  </span>
                  <span className="text-xs text-slate-400 font-mono truncate">{r.targetId}</span>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StarRating value={r.rating} />
                  <ReviewStatusBadge status={r.status} />
                </div>
              </div>
              {r.comment && (
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{r.comment}</p>
              )}
              <p className="mt-1.5 text-xs text-slate-400">
                {new Date(r.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}

export function MemberReviewsPanel() {
  const queryClient = useQueryClient();
  return (
    <AppShell role="MEMBER" title="Đánh giá" description="Chia sẻ trải nghiệm tập luyện của bạn.">
      <ScreenIntro
        eyebrow="Hội viên"
        title="Đánh giá ca tập & HLV"
        body="Gửi đánh giá sau khi tham dự ca. Góp ý giúp chúng tôi cải thiện chất lượng dịch vụ."
      />
      <SubmitReviewForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ["my-reviews"] })} />
      <MyReviews />
    </AppShell>
  );
}
