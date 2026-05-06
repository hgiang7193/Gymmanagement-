"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, MapPin, Navigation, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";

type Branch = { id: string; code: string; name: string; address: string };

const ERROR_MESSAGES: Record<string, string> = {
  SUBSCRIPTION_CONFLICT: "Bạn đã có lịch tập thử đang chờ. Hãy xem lại lịch của tôi.",
  BRANCH_NOT_FOUND: "Chi nhánh không tồn tại.",
  BRANCH_ID_REQUIRED: "Vui lòng chọn chi nhánh.",
  SCHEDULED_AT_REQUIRED: "Vui lòng chọn ngày giờ.",
  PHONE_NUMBER_REQUIRED: "Vui lòng nhập số điện thoại.",
  SCHEDULED_AT_IN_PAST: "Không thể đặt lịch trong quá khứ.",
};

const defaultSlots = [
  { value: "07:00", full: false },
  { value: "09:30", full: false },
  { value: "18:00", full: false },
  { value: "19:30", full: false },
  { value: "20:30", full: true },
];

function humanError(error: unknown) {
  const code = error instanceof Error ? error.message : String(error);
  return ERROR_MESSAGES[code] ?? code;
}

function fmtDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

function nextDays(length: number) {
  return Array.from({ length }, (_, idx) => {
    const current = new Date();
    current.setDate(current.getDate() + idx);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
}

export function GuestTrialBookingPanel() {
  const queryClient = useQueryClient();
  const { authorizedRequest } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [branchId, setBranchId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [accepted, setAccepted] = useState(false);

  const days = useMemo(() => nextDays(14), []);

  const branchesQuery = useQuery({
    queryKey: ["public-branches"],
    queryFn: async () => (await authorizedRequest<Branch[]>("/api/v1/branches")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!branchId || !selectedDate || !selectedSlot || !phoneNumber) {
        throw new Error("SCHEDULED_AT_REQUIRED");
      }
      const scheduledAt = new Date(`${selectedDate}T${selectedSlot}:00`);
      if (scheduledAt.getTime() < Date.now()) {
        throw new Error("SCHEDULED_AT_IN_PAST");
      }
      return (
        await authorizedRequest("/api/v1/trials", {
          method: "POST",
          body: JSON.stringify({
            branchId,
            trialPlanName: "Tập thử 1 buổi",
            scheduledAt: scheduledAt.toISOString(),
            phoneNumber,
            notes: notes.trim() || null,
          }),
        })
      ).data;
    },
    onSuccess: () => {
      toast.success("Đặt lịch thành công. Bạn có thể theo dõi trạng thái ngay.");
      void queryClient.invalidateQueries({ queryKey: ["my-trials"] });
      setStep(3);
      setAccepted(false);
    },
    onError: (error) => toast.error(humanError(error)),
  });

  const selectedBranch = (branchesQuery.data ?? []).find((branch) => branch.id === branchId);

  function onConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted) {
      toast.error("Vui lòng xác nhận điều khoản.");
      return;
    }
    createMutation.mutate();
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-[var(--black)]">
          <Sparkles className="h-6 w-6 text-[#facc15]" />
          Đặt lịch tập thử miễn phí
        </h1>
      </header>

      <div className="mb-8 grid grid-cols-3 gap-2">
        {["Chọn chi nhánh", "Chọn thời gian", "Xác nhận"].map((label, index) => {
          const number = (index + 1) as 1 | 2 | 3;
          const active = step === number;
          const done = step > number;
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (number === 1 || (number === 2 && branchId) || (number === 3 && branchId && selectedDate && selectedSlot)) {
                  setStep(number);
                }
              }}
              className={`rounded-xl border px-4 py-3 text-left text-sm ${
                active || done ? "border-[var(--primary-pink)] bg-[var(--pastel-pink)]" : "border-[var(--gray-100)] bg-white"
              }`}
            >
              <p className={`text-xs ${active || done ? "text-[var(--primary-pink)]" : "text-[var(--gray-500)]"}`}>Bước {number}</p>
              <p className={`mt-1 font-semibold ${active || done ? "text-[var(--black)]" : "text-[var(--gray-500)]"}`}>{label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {step === 1 ? (
            <div className="myfit-surface rounded-3xl p-6">
              <div className="mb-4 h-44 rounded-2xl bg-[linear-gradient(120deg,_#f5f5f5,_#e6e6fa)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--gray-500)]">Bản đồ chi nhánh</p>
                <p className="mt-2 text-sm text-[var(--gray-500)]">Map thật sẽ được tích hợp theo Google Maps/Leaflet ở bước tiếp theo.</p>
              </div>
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {(branchesQuery.data ?? []).map((branch) => {
                  const selected = branch.id === branchId;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => setBranchId(branch.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${
                        selected ? "border-[var(--soft-pink)] bg-[var(--pastel-pink)]" : "border-[var(--gray-100)] bg-white"
                      }`}
                    >
                      <div className="h-20 w-20 rounded-xl bg-[linear-gradient(145deg,_#fff0f3,_#ffe4e1)]" />
                      <div className="flex-1">
                        <p className="text-base font-semibold text-[var(--black)]">{branch.name}</p>
                        <p className="line-clamp-1 text-sm text-[var(--gray-500)]">{branch.address}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--primary-pink)]">
                          <Navigation className="h-3 w-3" />
                          Mã {branch.code}
                        </p>
                      </div>
                      <span className={`relative h-6 w-6 rounded-full border-2 ${selected ? "border-[var(--primary-pink)]" : "border-[var(--gray-300)]"}`}>
                        <span className={`absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary-pink)] ${selected ? "scale-100" : "scale-0"}`} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={!branchId}
                onClick={() => setStep(2)}
                className="myfit-btn-primary mt-5 h-12 w-full rounded-xl text-sm disabled:opacity-50"
              >
                Tiếp tục chọn thời gian
              </button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="myfit-surface rounded-3xl p-6">
              <p className="text-sm font-semibold text-[var(--black)]">Chọn ngày</p>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {days.map((day) => {
                  const isSelected = selectedDate === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={`rounded-xl border px-2 py-3 text-sm ${
                        isSelected ? "border-[var(--primary-pink)] bg-[var(--primary-pink)] text-white" : "border-[var(--gray-100)] bg-white text-[var(--black)]"
                      }`}
                    >
                      {new Date(`${day}T00:00:00`).getDate()}/{new Date(`${day}T00:00:00`).getMonth() + 1}
                    </button>
                  );
                })}
              </div>

              <p className="mt-6 text-sm font-semibold text-[var(--black)]">Chọn khung giờ</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {defaultSlots.map((slot) => {
                  const selected = selectedSlot === slot.value;
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      disabled={slot.full}
                      onClick={() => setSelectedSlot(slot.value)}
                      className={`rounded-xl border px-3 py-3 text-sm ${
                        slot.full
                          ? "cursor-not-allowed border-[var(--gray-100)] bg-[var(--gray-100)] text-[var(--gray-300)]"
                          : selected
                            ? "border-transparent bg-[var(--primary-pink)] text-white"
                            : "border-[var(--gray-300)] bg-white text-[var(--black)]"
                      }`}
                    >
                      {slot.value}
                      {slot.full ? <span className="ml-1 text-[10px] text-[var(--rose-error)]">Hết chỗ</span> : null}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!selectedDate || !selectedSlot}
                onClick={() => setStep(3)}
                className="myfit-btn-primary mt-5 h-12 w-full rounded-xl text-sm disabled:opacity-50"
              >
                Sang bước xác nhận
              </button>
            </div>
          ) : null}

          {step === 3 ? (
            <form className="myfit-surface rounded-3xl p-6" onSubmit={onConfirm}>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--gray-500)]">Số điện thoại</span>
                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value.replace(/[^\d]/g, ""))}
                  className="myfit-input"
                  placeholder="0900000000"
                  required
                />
              </label>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--gray-500)]">Ghi chú</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border-2 border-[var(--gray-100)] px-4 py-3 text-sm text-[var(--black)] outline-none focus:border-[var(--primary-pink)] focus:shadow-[0_0_0_4px_rgba(255,107,157,0.15)]"
                  placeholder="Ví dụ: muốn tập cùng bạn, mục tiêu giảm mỡ..."
                />
              </label>

              <label className="mt-4 flex items-center gap-2 text-sm text-[var(--gray-500)]">
                <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="h-4 w-4 accent-[var(--primary-pink)]" />
                Tôi đồng ý với <span className="text-[var(--primary-pink)]">điều khoản</span>
              </label>

              <button type="submit" disabled={createMutation.isPending} className="myfit-btn-primary mt-6 flex h-14 w-full items-center justify-center gap-2 text-base">
                {createMutation.isPending ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/50 border-t-white" /> : null}
                {createMutation.isPending ? "Đang xử lý..." : "Xác nhận đặt lịch"}
              </button>
            </form>
          ) : null}
        </div>

        <aside className="myfit-surface h-fit rounded-3xl bg-[var(--pastel-pink)] p-6">
          <CalendarDays className="h-8 w-8 text-[var(--primary-pink)]" />
          <h2 className="mt-3 text-lg font-bold text-[var(--black)]">Tóm tắt lịch tập thử</h2>
          <div className="mt-4 space-y-2 text-sm text-[var(--gray-500)]">
            <p className="text-base font-semibold text-[var(--black)]">{selectedDate ? fmtDate(selectedDate) : "Chưa chọn ngày"}</p>
            <p>{selectedSlot ? `Ca ${selectedSlot}` : "Chưa chọn khung giờ"}</p>
            <p className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {selectedBranch?.name ?? "Chưa chọn chi nhánh"}
            </p>
          </div>
          <div className="my-4 h-px bg-[var(--soft-pink)]" />
          <p className="myfit-number text-2xl font-bold text-[#059669]">Miễn phí 100%</p>

          <div className="mt-5 space-y-2">
            <Link href="/me/trials" className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--gray-300)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--black)]">
              Xem lịch của tôi
            </Link>
            {step === 3 && !createMutation.isPending && selectedBranch ? (
              <a
                href={`/api/v1/branches/${selectedBranch.id}/contact?redirect=1`}
                className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--primary-pink)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--primary-pink)]"
              >
                Liên hệ hỗ trợ
              </a>
            ) : null}
            {step === 3 && !createMutation.isPending ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--gray-500)]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--primary-pink)]" />
                Lịch sẽ được xác nhận qua điện thoại.
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
