"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Users, X, AlertTriangle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { ApiRequestError } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/types";

type Shift = {
  shiftId: string;
  shiftCode: string;
  startAt: string;
  endAt: string;
  coachCapacity: number;
  coachCount: number;
  isFull: boolean;
  isLocked: boolean;
  isAssigned: boolean;
};

type ShiftsResponse = {
  branchId: string;
  date: string;
  timezone: string;
  shifts: Shift[];
};

type ApiErrorResponse = {
  error?: Partial<ApiError> | null;
  message?: string;
};

const SHIFT_LABELS: Record<string, string> = {
  MORNING_1: "Sáng 1",
  MORNING_2: "Sáng 2",
  AFTERNOON_1: "Chiều 1",
  AFTERNOON_2: "Chiều 2",
  EVENING_1: "Tối 1",
  EVENING_2: "Tối 2",
};

const SHIFT_TIMES: Record<string, string> = {
  MORNING_1: "05:30–06:30",
  MORNING_2: "06:30–07:30",
  AFTERNOON_1: "16:30–17:30",
  AFTERNOON_2: "17:30–18:30",
  EVENING_1: "18:30–19:30",
  EVENING_2: "19:30–20:30",
};

const ERROR_TOAST: Record<string, string> = {
  SHIFT_COACH_CAPACITY_REACHED: "Ca này đã đủ HLV, không thể đăng ký thêm.",
  SHIFT_ALREADY_STARTED: "Ca đã bắt đầu, không thể thay đổi.",
  SHIFT_ASSIGNMENT_EXISTS: "Bạn đã đăng ký ca này rồi.",
  SHIFT_REQUIRES_AT_LEAST_ONE_COACH: "Không thể huỷ vì ca cần ít nhất 1 HLV.",
};

const DOW_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const DOW_FULL = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

type FilterType = "all" | "mine" | "available" | "full";

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatTime(isoString: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(isoString));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!isRecord(value)) return false;
  return value.error === undefined || value.error === null || isRecord(value.error);
}

function getErrorCode(error: unknown) {
  if (error instanceof ApiRequestError) return error.code ?? error.message;
  if (isApiErrorResponse(error) && typeof error.error?.code === "string") return error.error.code;
  if (error instanceof Error) return error.message;
  return "UNKNOWN_ERROR";
}

function toastError(error: unknown) {
  const code = getErrorCode(error);
  toast.error(ERROR_TOAST[code] ?? `Lỗi: ${code}`);
}

function buildDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type ConfirmState = { type: "assign" | "unassign"; shiftId: string; label: string } | null;

function ConfirmModal({
  state,
  loading,
  onConfirm,
  onClose,
}: {
  state: ConfirmState;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!state) return null;
  const isCancel = state.type === "unassign";
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[rgba(26,26,46,0.45)]" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex flex-col items-center text-center">
          <div
            className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full ${
              isCancel ? "bg-red-50" : "bg-[var(--pastel-pink)]"
            }`}
          >
            {isCancel ? (
              <AlertTriangle className="h-7 w-7 text-[var(--rose-error)]" />
            ) : (
              <Calendar className="h-7 w-7 text-[var(--primary-pink)]" />
            )}
          </div>
          <h3 className="text-base font-bold text-[var(--black)]">
            {isCancel ? "Huỷ đăng ký ca?" : "Đăng ký ca tập?"}
          </h3>
          <p className="mt-1 text-sm text-[var(--gray-500)]">{state.label}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-2xl border border-[var(--gray-300)] text-sm font-semibold text-[var(--gray-500)] hover:bg-[var(--gray-100)]"
          >
            {isCancel ? "Giữ lại" : "Không"}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-11 rounded-2xl text-sm font-semibold text-white disabled:opacity-50 ${
              isCancel
                ? "bg-[var(--rose-error)] hover:bg-red-500"
                : "myfit-btn-primary"
            }`}
          >
            {loading ? "Đang xử lý..." : isCancel ? "Huỷ đăng ký" : "Đăng ký"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CoachShiftsPanel() {
  const { authorizedRequest, session } = useAuth();
  const queryClient = useQueryClient();
  const today = getTodayString();

  const branchId = session?.branchIds?.[0] ?? "";
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(today);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const shiftsQuery = useQuery({
    queryKey: ["coach-shifts", branchId, selectedDate],
    queryFn: async () => {
      if (!branchId) return null;
      const res = await authorizedRequest<ShiftsResponse>(
        `/api/v1/coach/shifts?branch_id=${branchId}&date=${selectedDate}`
      );
      return res.data;
    },
    enabled: !!branchId && sheetOpen,
  });

  const assignMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      const res = await authorizedRequest(`/api/v1/coach/shifts/${shiftId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "" }),
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Đã đăng ký ca thành công.");
      setConfirmState(null);
      void queryClient.invalidateQueries({ queryKey: ["coach-shifts"] });
    },
    onError: (err) => {
      setConfirmState(null);
      toastError(err);
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      const res = await authorizedRequest(`/api/v1/coach/shifts/${shiftId}/assign`, {
        method: "DELETE",
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Đã huỷ đăng ký ca.");
      setConfirmState(null);
      void queryClient.invalidateQueries({ queryKey: ["coach-shifts"] });
    },
    onError: (err) => {
      setConfirmState(null);
      toastError(err);
    },
  });

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const totalCells = startOffset + daysInMonth;
  const trailingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setViewMonth(m);
    setViewYear(y);
  }

  function openDay(day: number) {
    setSelectedDate(buildDateKey(viewYear, viewMonth, day));
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
  }

  if (!branchId) {
    return (
      <div className="rounded-2xl border border-[var(--peach)] bg-[var(--peach)]/30 p-5 text-sm text-[var(--black)]">
        Bạn chưa được gán chi nhánh. Liên hệ quản lý để được cấp quyền.
      </div>
    );
  }

  const todayDate = new Date();
  const todayKey = getTodayString();
  const shifts = shiftsQuery.data?.shifts ?? [];
  const selectedDow = new Date(selectedDate + "T00:00:00").getDay();
  const selectedDay = parseInt(selectedDate.split("-")[2]);
  const mutating = assignMutation.isPending || unassignMutation.isPending;

  const filterPills: { key: FilterType; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "mine", label: "Ca của tôi" },
    { key: "available", label: "Còn slot" },
    { key: "full", label: "Đã đủ" },
  ];

  function filterShifts(list: Shift[]): Shift[] {
    if (activeFilter === "mine") return list.filter((s) => s.isAssigned);
    if (activeFilter === "available") return list.filter((s) => !s.isFull && !s.isLocked && !s.isAssigned);
    if (activeFilter === "full") return list.filter((s) => s.isFull || s.isLocked);
    return list;
  }

  const visibleShifts = filterShifts(shifts);

  return (
    <div className="min-h-screen bg-[var(--gray-100)]">
      <div
        className="px-4 pt-6 pb-5"
        style={{
          background: "linear-gradient(135deg, var(--lavender) 0%, var(--soft-pink) 100%)",
        }}
      >
        <h1 className="text-xl font-bold text-[var(--black)] mb-4">Lịch làm việc</h1>
        <div className="flex gap-2">
          <button className="flex-1 h-9 rounded-xl bg-white/80 text-sm font-semibold text-[var(--primary-pink)] shadow-sm border border-white/60">
            Tháng
          </button>
          <button className="flex-1 h-9 rounded-xl bg-white/30 text-sm font-semibold text-[var(--black)]/70 border border-white/40">
            Tuần
          </button>
        </div>
      </div>

      <div className="px-4 py-3 bg-white border-b border-[var(--gray-100)]">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filterPills.map((pill) => (
            <button
              key={pill.key}
              onClick={() => setActiveFilter(pill.key)}
              className={`shrink-0 h-8 px-4 rounded-full text-xs font-semibold transition-colors ${
                activeFilter === pill.key
                  ? "bg-[var(--primary-pink)] text-white shadow-sm"
                  : "bg-[var(--gray-100)] text-[var(--gray-500)] hover:bg-[var(--pastel-pink)] hover:text-[var(--primary-pink)]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gray-100)]">
            <button
              onClick={() => changeMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--gray-100)] bg-white shadow-sm hover:bg-[var(--pastel-pink)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-[var(--black)]" />
            </button>
            <h2 className="text-lg font-bold text-[var(--black)]">
              Tháng {viewMonth}/{viewYear}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--gray-100)] bg-white shadow-sm hover:bg-[var(--pastel-pink)] transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-[var(--black)]" />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-[var(--gray-100)]">
            {DOW_LABELS.map((d, i) => (
              <div
                key={d}
                className={`py-2.5 text-center text-[11px] font-semibold ${
                  i >= 5 ? "text-[var(--rose-error)]" : "text-[var(--gray-500)]"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div
                key={`blank-${i}`}
                className="min-h-[80px] border-b border-r border-gray-50 bg-[var(--gray-100)]/20"
              />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const key = buildDateKey(viewYear, viewMonth, day);
              const isToday = key === todayKey;
              const isPast = new Date(key + "T23:59:59") < todayDate;
              const isSelected = key === selectedDate && sheetOpen;
              const col = (startOffset + i) % 7;
              const isWeekend = col >= 5;

              return (
                <button
                  key={day}
                  onClick={() => openDay(day)}
                  className={`min-h-[80px] border-b border-r border-gray-50 p-1.5 text-left transition-colors hover:bg-pink-50/60 ${
                    isPast ? "opacity-60" : ""
                  } ${isSelected ? "bg-[var(--pastel-pink)]/60" : "bg-white"}`}
                >
                  <div className="flex justify-center">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday
                          ? "bg-[var(--primary-pink)] text-white shadow-sm"
                          : isWeekend
                          ? "text-[var(--rose-error)]"
                          : "text-[var(--black)]"
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                  {isToday && (
                    <div className="mt-1.5 flex justify-center gap-0.5">
                      <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
                    </div>
                  )}
                </button>
              );
            })}

            {Array.from({ length: trailingCells }).map((_, i) => (
              <div
                key={`trail-${i}`}
                className="min-h-[80px] border-b border-r border-gray-50 bg-[var(--gray-100)]/20"
              />
            ))}
          </div>
        </div>

        <div className="flex gap-4 px-1 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
            <span className="text-[11px] text-[var(--gray-500)]">Đã đăng ký</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#059669]" />
            <span className="text-[11px] text-[var(--gray-500)]">Còn slot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--gray-300)]" />
            <span className="text-[11px] text-[var(--gray-500)]">Đã đủ HLV</span>
          </div>
        </div>
      </div>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(26,26,46,0.3)]"
          onClick={closeSheet}
        />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
          sheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div
          className="mx-auto max-w-lg rounded-t-3xl bg-white shadow-2xl"
          style={{ maxHeight: "78vh", overflowY: "auto" }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-[var(--gray-300)]" />
          </div>

          <div className="flex items-center justify-between border-b border-[var(--gray-100)] px-5 pb-3">
            <div>
              <h3 className="text-base font-bold text-[var(--black)]">
                Ca ngày {String(selectedDay).padStart(2, "0")}/{String(viewMonth).padStart(2, "0")}
              </h3>
              <p className="text-xs text-[var(--gray-500)]">{DOW_FULL[selectedDow]}</p>
            </div>
            <button
              onClick={closeSheet}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gray-100)] text-[var(--gray-500)] hover:bg-[var(--gray-300)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-3">
            {shiftsQuery.isLoading && (
              <div className="flex items-center justify-center py-8 gap-2 text-sm text-[var(--gray-500)]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--gray-300)] border-t-[var(--primary-pink)]" />
                Đang tải ca tập...
              </div>
            )}
            {shiftsQuery.isError && (
              <p className="text-sm text-[var(--rose-error)] py-4 text-center">
                Không tải được lịch. Thử lại sau.
              </p>
            )}
            {!shiftsQuery.isLoading && shifts.length === 0 && (
              <div className="py-8 text-center">
                <Calendar className="mx-auto h-10 w-10 text-[var(--gray-300)] mb-2" />
                <p className="text-sm text-[var(--gray-500)]">Không có ca nào ngày này.</p>
              </div>
            )}
            {!shiftsQuery.isLoading && shifts.length > 0 && visibleShifts.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-[var(--gray-500)]">Không có ca nào phù hợp bộ lọc.</p>
              </div>
            )}
            {visibleShifts.map((shift) => {
              const label = SHIFT_LABELS[shift.shiftCode] ?? shift.shiftCode;
              const time =
                SHIFT_TIMES[shift.shiftCode] ??
                `${formatTime(shift.startAt)}–${formatTime(shift.endAt)}`;

              if (shift.isAssigned) {
                return (
                  <div
                    key={shift.shiftId}
                    className="rounded-xl border border-[#7C3AED] bg-[rgba(230,230,250,0.3)] p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-[var(--black)]">{label}</p>
                        <p className="text-xs text-[var(--gray-500)] mt-0.5">{time}</p>
                      </div>
                      <span className="rounded-full bg-[#E6E6FA] px-2.5 py-0.5 text-[10px] font-semibold text-[#7C3AED]">
                        Đã đăng ký
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--gray-500)]">
                        <Users className="h-3.5 w-3.5" />
                        {shift.coachCount}/{shift.coachCapacity} HLV
                      </div>
                      {!shift.isLocked && (
                        <button
                          onClick={() =>
                            setConfirmState({
                              type: "unassign",
                              shiftId: shift.shiftId,
                              label: `${label} (${time})`,
                            })
                          }
                          className="h-9 rounded-lg border border-[#FB7185] px-4 text-xs font-semibold text-[#FB7185] hover:bg-[#FB7185] hover:text-white transition-colors"
                        >
                          Huỷ đăng ký
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              if (shift.isFull || shift.isLocked) {
                return (
                  <div
                    key={shift.shiftId}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-[var(--black)]">{label}</p>
                        <p className="text-xs text-[var(--gray-500)] mt-0.5">{time}</p>
                      </div>
                      <span className="rounded-full bg-[var(--gray-300)]/60 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--gray-500)]">
                        {shift.isLocked ? "Đã khoá" : "Đã đủ HLV"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--gray-500)]">
                      <Users className="h-3.5 w-3.5" />
                      {shift.coachCount}/{shift.coachCapacity} HLV
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={shift.shiftId}
                  className="rounded-xl border border-[#059669] bg-[var(--mint)] p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-[var(--black)]">{label}</p>
                      <p className="text-xs text-[var(--gray-500)] mt-0.5">{time}</p>
                    </div>
                    <span className="rounded-full bg-[#D1FAE5] px-2.5 py-0.5 text-[10px] font-semibold text-[#059669]">
                      Còn {shift.coachCapacity - shift.coachCount} slot
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--gray-500)]">
                      <Users className="h-3.5 w-3.5" />
                      {shift.coachCount}/{shift.coachCapacity} HLV
                    </div>
                    <button
                      onClick={() =>
                        setConfirmState({
                          type: "assign",
                          shiftId: shift.shiftId,
                          label: `${label} (${time})`,
                        })
                      }
                      className="h-9 rounded-lg border border-[#059669] px-4 text-xs font-semibold text-[#059669] hover:bg-[#059669] hover:text-white transition-colors"
                    >
                      Đăng ký
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ConfirmModal
        state={confirmState}
        loading={mutating}
        onClose={() => setConfirmState(null)}
        onConfirm={() => {
          if (!confirmState) return;
          if (confirmState.type === "assign") assignMutation.mutate(confirmState.shiftId);
          else unassignMutation.mutate(confirmState.shiftId);
        }}
      />
    </div>
  );
}
