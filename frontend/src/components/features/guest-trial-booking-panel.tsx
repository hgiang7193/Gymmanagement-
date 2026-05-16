"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Sparkles,
  User,
} from "lucide-react";
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

const STEP_LABELS = ["Chi nhánh", "Lịch & Giờ", "Xác nhận"] as const;

function humanError(error: unknown) {
  const code = error instanceof Error ? error.message : String(error);
  return ERROR_MESSAGES[code] ?? code;
}

function fmtDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
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

function getCalendarWeeks(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
  const [success, setSuccess] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    return toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

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
      setAccepted(false);
      setSuccess(true);
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

  function goStep(target: 1 | 2 | 3) {
    if (target === 1 || (target === 2 && branchId) || (target === 3 && branchId && selectedDate && selectedSlot)) {
      setStep(target);
    }
  }

  const calendarCells = useMemo(() => getCalendarWeeks(calYear, calMonth), [calYear, calMonth]);
  const monthLabel = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(
    new Date(calYear, calMonth, 1)
  );

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  }

  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  }

  if (success) {
    return (
      <section className="mx-auto w-full max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--mint)]">
          <CheckCircle2 className="h-10 w-10 text-[#059669]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--black)]">Đặt lịch thành công!</h1>
        <p className="mt-2 text-sm text-[var(--gray-500)]">
          Chúng tôi sẽ xác nhận qua điện thoại của bạn sớm nhất.
        </p>
        <div
          className="myfit-surface mx-auto mt-8 max-w-sm rounded-2xl p-6 text-left"
          style={{ borderColor: "var(--blush)" }}
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--gray-500)]">
            Chi tiết lịch hẹn
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pastel-pink)]">
                <MapPin className="h-4 w-4 text-[var(--primary-pink)]" />
              </div>
              <span className="font-medium text-[var(--black)]">{selectedBranch?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pastel-pink)]">
                <CalendarDays className="h-4 w-4 text-[var(--primary-pink)]" />
              </div>
              <span className="text-[var(--black)]">{selectedDate ? fmtDate(selectedDate) : ""}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pastel-pink)]">
                <Clock className="h-4 w-4 text-[var(--primary-pink)]" />
              </div>
              <span className="text-[var(--black)]">Ca {selectedSlot}</span>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-[var(--mint)] px-4 py-3 text-sm font-bold text-[#059669]">
            Miễn phí 100%
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/me/trials"
            className="myfit-btn-primary inline-flex h-12 items-center justify-center rounded-2xl px-8 text-sm font-bold"
          >
            Xem lịch của tôi
          </Link>
          <button
            type="button"
            onClick={() => {
              setSuccess(false);
              setStep(1);
              setBranchId("");
              setSelectedDate("");
              setSelectedSlot("");
              setPhoneNumber("");
              setNotes("");
            }}
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-[var(--blush)] bg-white px-8 text-sm font-semibold text-[var(--black)]"
          >
            Đặt lịch mới
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-[var(--black)]">
          <Sparkles className="h-6 w-6 text-[#facc15]" />
          Đặt lịch tập thử miễn phí
        </h1>
        <p className="mt-2 text-sm text-[var(--gray-500)]">Hoàn toàn miễn phí — trải nghiệm trước, quyết định sau.</p>
      </header>

      <div className="mb-8 flex items-center gap-0">
        {STEP_LABELS.map((label, index) => {
          const number = (index + 1) as 1 | 2 | 3;
          const active = step === number;
          const done = step > number;
          return (
            <div key={label} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => goStep(number)}
                className="flex flex-1 flex-col items-center gap-1.5 text-center"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all"
                  style={
                    done
                      ? { background: "#059669", color: "#fff" }
                      : active
                        ? {
                            background: "var(--primary-pink)",
                            color: "#fff",
                            boxShadow: "0 0 0 4px rgba(255,107,157,0.2)",
                          }
                        : { background: "var(--gray-100)", color: "var(--gray-500)" }
                  }
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : number}
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: active || done ? "var(--primary-pink)" : "var(--gray-500)" }}
                >
                  {label}
                </span>
              </button>
              {index < STEP_LABELS.length - 1 ? (
                <div
                  className="mb-5 h-0.5 w-8 flex-shrink-0 transition-colors"
                  style={{ background: done ? "#059669" : "var(--gray-300)" }}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {step === 1 ? (
            <div className="myfit-surface rounded-3xl p-6">
              <p className="mb-4 text-sm font-bold text-[var(--black)]">Chọn chi nhánh phù hợp với bạn</p>
              <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
                {branchesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--gray-300)] border-t-[var(--primary-pink)]" />
                  </div>
                ) : (branchesQuery.data ?? []).map((branch) => {
                  const selected = branch.id === branchId;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => setBranchId(branch.id)}
                      className="flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all"
                      style={{
                        borderColor: selected ? "var(--primary-pink)" : "var(--blush)",
                        background: selected ? "var(--pastel-pink)" : "white",
                      }}
                    >
                      <div
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "linear-gradient(145deg, var(--pastel-pink), var(--blush))" }}
                      >
                        <MapPin className="h-5 w-5 text-[var(--primary-pink)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[var(--black)]">{branch.name}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-[var(--gray-500)]">{branch.address}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--primary-pink)]">
                          <Navigation className="h-3 w-3" />
                          Mã {branch.code}
                        </p>
                      </div>
                      <span
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all"
                        style={{
                          borderColor: selected ? "var(--primary-pink)" : "var(--gray-300)",
                          background: selected ? "var(--primary-pink)" : "white",
                        }}
                      >
                        {selected ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={!branchId}
                onClick={() => setStep(2)}
                className="myfit-btn-primary mt-5 h-12 w-full rounded-2xl text-sm disabled:opacity-50"
              >
                Tiếp tục chọn thời gian →
              </button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="myfit-surface rounded-3xl p-6">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-bold text-[var(--black)]">{monthLabel}</p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--gray-100)] text-[var(--gray-500)] hover:bg-[var(--gray-100)]"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--gray-100)] text-[var(--gray-500)] hover:bg-[var(--gray-100)]"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="mb-2 grid grid-cols-7 text-center">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                  <span key={d} className="py-1 text-[11px] font-bold text-[var(--gray-500)]">
                    {d}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((day, idx) => {
                  if (day === null) return <div key={idx} />;
                  const dateStr = toDateStr(calYear, calMonth, day);
                  const isToday = dateStr === today;
                  const isSelected = selectedDate === dateStr;
                  const isPast = dateStr < today;
                  const isAvailable = days.includes(dateStr);
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isPast || !isAvailable}
                      onClick={() => setSelectedDate(dateStr)}
                      className="flex h-9 w-full items-center justify-center rounded-xl text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30"
                      style={
                        isSelected
                          ? { background: "var(--primary-pink)", color: "white" }
                          : isToday
                            ? { background: "var(--pastel-pink)", color: "var(--primary-pink)", fontWeight: 700 }
                            : isAvailable
                              ? { background: "var(--gray-100)", color: "var(--black)" }
                              : {}
                      }
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="my-5 h-px bg-[var(--blush)]" />

              <p className="mb-3 font-bold text-[var(--black)]">Chọn khung giờ</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {defaultSlots.map((slot) => {
                  const selected = selectedSlot === slot.value;
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      disabled={slot.full}
                      onClick={() => setSelectedSlot(slot.value)}
                      className="flex flex-col items-center gap-1 rounded-2xl border-2 px-3 py-3 text-sm transition-all disabled:cursor-not-allowed"
                      style={
                        slot.full
                          ? { borderColor: "var(--gray-100)", background: "var(--gray-100)", opacity: 0.6 }
                          : selected
                            ? {
                                borderColor: "transparent",
                                background: "linear-gradient(135deg, var(--primary-pink), var(--deep-pink))",
                                color: "white",
                              }
                            : { borderColor: "var(--primary-pink)", background: "white", color: "var(--black)" }
                      }
                    >
                      <Clock
                        className="h-4 w-4"
                        style={{ color: slot.full ? "var(--gray-300)" : selected ? "white" : "var(--primary-pink)" }}
                      />
                      <span className="font-bold">{slot.value}</span>
                      {slot.full ? (
                        <span className="text-[10px] text-[var(--rose-error)]">Hết chỗ</span>
                      ) : (
                        <span
                          className="text-[10px]"
                          style={{ color: selected ? "rgba(255,255,255,0.8)" : "var(--gray-500)" }}
                        >
                          Đặt lịch
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!selectedDate || !selectedSlot}
                onClick={() => setStep(3)}
                className="myfit-btn-primary mt-5 h-12 w-full rounded-2xl text-sm disabled:opacity-50"
              >
                Sang bước xác nhận →
              </button>
            </div>
          ) : null}

          {step === 3 ? (
            <form className="myfit-surface rounded-3xl p-6" onSubmit={onConfirm}>
              <p className="mb-5 font-bold text-[var(--black)]">Thông tin liên hệ</p>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--gray-500)]">
                  <Phone className="h-3.5 w-3.5" />
                  Số điện thoại
                  <span style={{ color: "var(--rose-error)" }}>*</span>
                </span>
                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value.replace(/[^\d]/g, ""))}
                  className="myfit-input"
                  placeholder="0900000000"
                  required
                />
              </label>

              <label className="mt-4 block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--gray-500)]">
                  <User className="h-3.5 w-3.5" />
                  Ghi chú
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border-2 border-[var(--gray-100)] px-4 py-3 text-sm text-[var(--black)] outline-none focus:border-[var(--primary-pink)] focus:shadow-[0_0_0_4px_rgba(255,107,157,0.15)]"
                  placeholder="Ví dụ: muốn tập cùng bạn, mục tiêu giảm mỡ..."
                />
              </label>

              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[var(--blush)] bg-[var(--pastel-pink)] p-4 text-sm">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                  className="h-4 w-4 accent-[var(--primary-pink)]"
                />
                <span className="text-[var(--gray-500)]">
                  Tôi đồng ý với{" "}
                  <span className="font-semibold text-[var(--primary-pink)] underline underline-offset-2">
                    điều khoản sử dụng
                  </span>
                </span>
              </label>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="myfit-btn-primary mt-6 flex h-14 w-full items-center justify-center gap-2 text-base"
              >
                {createMutation.isPending ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                {createMutation.isPending ? "Đang xử lý..." : "Đặt lịch thử"}
              </button>
            </form>
          ) : null}
        </div>

        <aside
          className="myfit-surface h-fit rounded-3xl p-6"
          style={{ background: "var(--pastel-pink)", borderColor: "var(--blush)" }}
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-[var(--primary-pink)]" />
            <h2 className="text-base font-bold text-[var(--black)]">Tóm tắt lịch tập thử</h2>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-3">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--primary-pink)]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gray-500)]">Chi nhánh</p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--black)]">
                  {selectedBranch?.name ?? "Chưa chọn"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-3">
              <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--primary-pink)]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gray-500)]">Ngày tập</p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--black)]">
                  {selectedDate ? fmtDate(selectedDate) : "Chưa chọn ngày"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-3">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--primary-pink)]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gray-500)]">Khung giờ</p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--black)]">
                  {selectedSlot ? `Ca ${selectedSlot}` : "Chưa chọn"}
                </p>
              </div>
            </div>
          </div>

          <div className="my-4 h-px bg-[var(--soft-pink)]" />

          <div className="rounded-2xl bg-[var(--mint)] px-4 py-3 text-center">
            <p className="myfit-number text-2xl font-bold text-[#059669]">Miễn phí 100%</p>
            <p className="mt-0.5 text-xs text-[#059669]/80">Không yêu cầu thanh toán</p>
          </div>

          <div className="mt-5 space-y-2">
            <Link
              href="/me/trials"
              className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--gray-300)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--black)]"
            >
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
