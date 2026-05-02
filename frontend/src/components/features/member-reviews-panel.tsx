"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`text-2xl transition ${star <= value ? "text-amber-400" : "text-slate-300"} ${onChange ? "hover:text-amber-300 cursor-pointer" : "cursor-default"}`}
        >
          ★
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
      setTargetId(""); setComment(""); setRating(5);
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
    <SurfaceCard title="Gửi đánh giá" description="UC-REV-01 đến UC-REV-04: Đánh giá ca tập, HLV, thiết bị hoặc bài tập.">
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Đối tượng đánh giá *</span>
            <select value={targetType} onChange={e => setTargetType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white">
              {Object.entries(TARGET_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">ID đối tượng *</span>
            <input required value={targetId} onChange={e => setTargetId(e.target.value)}
              placeholder={`Nhập ${TARGET_LABELS[targetType]} ID...`}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </label>
          <div className="block space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700 block mb-1">Điểm đánh giá *</span>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <label className="block space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Nhận xét (tuỳ chọn)</span>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400 resize-none" />
          </label>
        </div>
        <button type="submit" disabled={mutation.isPending}
          className="rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:bg-slate-400 transition">
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
          {reviews.map(r => (
            <div key={r.id} className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">{TARGET_LABELS[r.targetType] ?? r.targetType} · <span className="text-slate-500 font-normal">{r.targetId}</span></span>
                <StarRating value={r.rating} />
              </div>
              {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
              <p className="mt-0.5 text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</p>
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
      <ScreenIntro eyebrow="Member" title="Đánh giá ca tập & HLV" body="Gửi đánh giá sau khi tham dự ca. Góp ý giúp chúng tôi cải thiện chất lượng dịch vụ." />
      <SubmitReviewForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ["my-reviews"] })} />
      <MyReviews />
    </AppShell>
  );
}
