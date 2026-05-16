"use client";

import { useState, useMemo, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Delete,
  Dumbbell,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";

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

type DatePill = {
  date: Date;
  dayAbbr: string;
  dayNum: number;
  isToday: boolean;
  key: string;
};

const SHIFT_LABELS: Record<string, string> = {
  MORNING_1: "Sáng 1",
  MORNING_2: "Sáng 2",
  AFTERNOON_1: "Chiều 1",
  AFTERNOON_2: "Chiều 2",
  EVENING_1: "Tối 1",
  EVENING_2: "Tối 2",
};

const DAY_ABBR = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const SESSION_INDEX: Record<string, number> = {
  MORNING_1: 1,
  MORNING_2: 2,
  AFTERNOON_1: 3,
  AFTERNOON_2: 4,
  EVENING_1: 5,
  EVENING_2: 6,
};

const MAX_CAPACITY: Record<string, number> = {
  MORNING_1: 30,
  MORNING_2: 30,
  AFTERNOON_1: 30,
  AFTERNOON_2: 30,
  EVENING_1: 30,
  EVENING_2: 30,
};

function formatTime(val: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(val));
}

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildDatePills(): DatePill[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pills: DatePill[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    pills.push({
      date: d,
      dayAbbr: DAY_ABBR[d.getDay()],
      dayNum: d.getDate(),
      isToday: i === 0,
      key: formatLocalDate(d),
    });
  }
  return pills;
}

function computeBmi(weightKg: number, heightCm = 165): { value: number; label: string; color: string } {
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);
  const value = Math.round(bmi * 10) / 10;
  if (bmi < 18.5) return { value, label: "Thiếu cân", color: "#3B82F6" };
  if (bmi < 25) return { value, label: "Bình thường", color: "#10B981" };
  if (bmi < 30) return { value, label: "Thừa cân", color: "#F59E0B" };
  return { value, label: "Béo phì", color: "#EF4444" };
}

function ShiftStatusBadge({ shift }: { shift: Shift }) {
  const now = new Date();
  const start = new Date(shift.startAt);
  const end = new Date(shift.endAt);
  const openWindow = new Date(start.getTime() - 30 * 60 * 1000);

  if (shift.alreadyCheckedIn) return "checkedin";
  if (now >= openWindow && now <= end) return "open";
  return "ended";
}

function ShiftCard({
  shift,
  onCheckIn,
}: {
  shift: Shift;
  onCheckIn: (shift: Shift) => void;
}) {
  const label = SHIFT_LABELS[shift.shiftCode] ?? shift.shiftCode;
  const timeRange = `${formatTime(shift.startAt)} – ${formatTime(shift.endAt)}`;
  const status = ShiftStatusBadge({ shift });
  const sessionNum = SESSION_INDEX[shift.shiftCode] ?? 1;
  const capacity = MAX_CAPACITY[shift.shiftCode] ?? 30;

  if (status === "checkedin") {
    return (
      <div
        className="rounded-2xl bg-white shadow-sm border-l-4 overflow-hidden"
        style={{ borderLeftColor: "var(--mint)" }}
      >
        <div
          className="p-4"
          style={{ background: "rgba(240,255,244,0.3)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--mint)" }}
            >
              <CheckCircle2 className="h-5 w-5" style={{ color: "#059669" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p
                  className="text-sm font-bold"
                  style={{ color: "var(--black)" }}
                >
                  {label}
                </p>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: "var(--mint)", color: "#059669" }}
                >
                  Ca {sessionNum}
                </span>
              </div>
              <p className="text-xs flex items-center gap-1" style={{ color: "var(--gray-500)" }}>
                <Clock className="h-3 w-3" />
                {timeRange}
              </p>
              <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--gray-500)" }}>
                <Users className="h-3 w-3" />
                {shift.totalCheckins}/{capacity} học viên
              </p>
            </div>
            <span
              className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--mint)", color: "#059669" }}
            >
              Đã điểm danh
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (status === "ended") {
    return (
      <div
        className="rounded-2xl bg-white border-l-4 overflow-hidden opacity-60"
        style={{ borderLeftColor: "#D1D5DB" }}
      >
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--gray-100)" }}
            >
              <Clock className="h-5 w-5" style={{ color: "var(--gray-500)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p
                  className="text-sm font-bold"
                  style={{ color: "var(--black)" }}
                >
                  {label}
                </p>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: "var(--gray-100)", color: "var(--gray-500)" }}
                >
                  Ca {sessionNum}
                </span>
              </div>
              <p className="text-xs flex items-center gap-1" style={{ color: "var(--gray-500)" }}>
                <Clock className="h-3 w-3" />
                {timeRange}
              </p>
              <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--gray-500)" }}>
                <Users className="h-3 w-3" />
                {shift.totalCheckins}/{capacity} học viên
              </p>
            </div>
            <span
              className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--gray-100)", color: "var(--gray-500)" }}
            >
              Đã kết thúc
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl bg-white shadow-sm border-l-4 overflow-hidden transition-all hover:shadow-md"
      style={{ borderLeftColor: "var(--primary-pink)" }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--pastel-pink)" }}
          >
            <Dumbbell className="h-5 w-5" style={{ color: "var(--primary-pink)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p
                className="text-sm font-bold"
                style={{ color: "var(--black)" }}
              >
                {label}
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "var(--pastel-pink)", color: "var(--deep-pink)" }}
              >
                Ca {sessionNum}
              </span>
            </div>
            <p className="text-xs flex items-center gap-1" style={{ color: "var(--gray-500)" }}>
              <Clock className="h-3 w-3" />
              {timeRange}
            </p>
            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--gray-500)" }}>
              <Users className="h-3 w-3" />
              {shift.totalCheckins}/{capacity} học viên
            </p>
          </div>
          <button
            onClick={() => onCheckIn(shift)}
            className="myfit-btn-primary flex-shrink-0 h-9 rounded-xl px-4 text-sm font-semibold"
          >
            Điểm danh
          </button>
        </div>
      </div>
    </div>
  );
}

function NumPad({
  value,
  onChange,
  onConfirm,
}: {
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
}) {
  function handleDigit(d: string) {
    if (value === "0" && d !== ".") {
      onChange(d);
      return;
    }
    if (d === "." && value.includes(".")) return;
    const next = value + d;
    const parts = next.split(".");
    if (parts[0].length > 3) return;
    if (parts[1] && parts[1].length > 1) return;
    onChange(next);
  }

  function handleDelete() {
    if (value.length <= 1) {
      onChange("");
      return;
    }
    onChange(value.slice(0, -1));
  }

  const keys: Array<{ label: string | ReactNode; action: () => void; special?: boolean }> = [
    { label: "1", action: () => handleDigit("1") },
    { label: "2", action: () => handleDigit("2") },
    { label: "3", action: () => handleDigit("3") },
    { label: "4", action: () => handleDigit("4") },
    { label: "5", action: () => handleDigit("5") },
    { label: "6", action: () => handleDigit("6") },
    { label: "7", action: () => handleDigit("7") },
    { label: "8", action: () => handleDigit("8") },
    { label: "9", action: () => handleDigit("9") },
    { label: ".", action: () => handleDigit(".") },
    { label: "0", action: () => handleDigit("0") },
    {
      label: <Delete className="h-4 w-4" />,
      action: handleDelete,
      special: true,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((k, i) => (
        <button
          key={i}
          type="button"
          onClick={k.action}
          className="flex h-12 items-center justify-center rounded-2xl text-base font-semibold transition-all active:scale-95"
          style={{
            background: k.special ? "var(--pastel-pink)" : "var(--gray-100)",
            color: k.special ? "var(--deep-pink)" : "var(--black)",
          }}
        >
          {k.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onConfirm}
        className="col-span-3 myfit-btn-primary h-12 rounded-2xl text-sm font-bold mt-1"
      >
        Xác nhận điểm danh
      </button>
    </div>
  );
}

function CheckInBottomSheet({
  shift,
  onClose,
  onConfirm,
  loading,
  success,
}: {
  shift: Shift;
  onClose: () => void;
  onConfirm: (weightKg: number, source: string) => void;
  loading: boolean;
  success: boolean;
}) {
  const [weight, setWeight] = useState("");
  const source = "manual";

  const label = SHIFT_LABELS[shift.shiftCode] ?? shift.shiftCode;
  const weightNum = parseFloat(weight);
  const validWeight = !isNaN(weightNum) && weightNum >= 20 && weightNum <= 300;
  const bmi = validWeight ? computeBmi(weightNum) : null;

  function handleConfirm() {
    if (!validWeight) {
      toast.error("Vui lòng nhập cân nặng hợp lệ (20–300 kg)");
      return;
    }
    onConfirm(weightNum, source);
  }

  const displayWeight = weight === "" ? "- -" : weight;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(26,26,46,0.55)" }}
        onClick={onClose}
      />
      <div
        className="relative rounded-t-3xl overflow-hidden"
        style={{ background: "#fff", maxHeight: "92vh", overflowY: "auto" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="rounded-full"
            style={{ width: 40, height: 4, background: "var(--gray-300)" }}
          />
        </div>

        <div className="px-6 pb-8 space-y-5">
          <div className="text-center pt-1">
            <h2
              className="text-base font-bold"
              style={{ color: "var(--black)" }}
            >
              {label}
            </h2>
            <p
              className="text-xs mt-0.5 flex items-center justify-center gap-1"
              style={{ color: "var(--gray-500)" }}
            >
              <Clock className="h-3 w-3" />
              {formatTime(shift.startAt)} – {formatTime(shift.endAt)}
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{
                  background: "linear-gradient(135deg, var(--primary-pink) 0%, var(--deep-pink) 100%)",
                  boxShadow: "0 8px 32px rgba(255,107,157,0.4)",
                }}
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <div className="text-center">
                <p
                  className="text-lg font-bold"
                  style={{ color: "var(--black)" }}
                >
                  Điểm danh thành công!
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--gray-500)" }}
                >
                  Chúc bạn tập luyện hiệu quả
                </p>
              </div>
              <div
                className="w-full rounded-2xl p-4 text-center"
                style={{ background: "var(--mint)" }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#059669" }}
                >
                  Đã ghi nhận cân nặng {weight} kg
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center py-2">
                <div
                  className="text-6xl font-bold tracking-tight myfit-number"
                  style={{ color: "var(--black)" }}
                >
                  {displayWeight}
                </div>
                <div
                  className="text-xl font-semibold mt-1"
                  style={{ color: "var(--gray-500)" }}
                >
                  kg
                </div>
              </div>

              {bmi && (
                <div
                  className="flex items-center justify-between rounded-2xl px-4 py-3"
                  style={{ background: "var(--gray-100)" }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--gray-500)" }}
                  >
                    Chỉ số BMI
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold"
                      style={{ color: "var(--black)" }}
                    >
                      {bmi.value}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block rounded-full"
                        style={{
                          width: 8,
                          height: 8,
                          background: bmi.color,
                        }}
                      />
                      <span
                        className="text-xs font-semibold rounded-full px-2 py-0.5"
                        style={{
                          background: `${bmi.color}22`,
                          color: bmi.color,
                        }}
                      >
                        {bmi.label}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <NumPad
                value={weight}
                onChange={setWeight}
                onConfirm={handleConfirm}
              />

              {loading && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                    style={{ borderColor: "var(--primary-pink)", borderTopColor: "transparent" }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--gray-500)" }}
                  >
                    Đang lưu...
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function MemberCheckInPanel() {
  const { authorizedRequest, session } = useAuth();
  const queryClient = useQueryClient();
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const today = new Date();
    return formatLocalDate(today);
  });

  const branchId = session?.branchIds?.[0];
  const datePills = useMemo(() => buildDatePills(), []);

  const avatarInitials = useMemo(() => {
    if (!session?.userId) return "M";
    return session.userId.slice(0, 1).toUpperCase();
  }, [session]);

  const shiftsQuery = useQuery({
    queryKey: ["member-available-shifts", branchId],
    queryFn: async () => {
      if (!branchId) return [];
      const res = await authorizedRequest<Shift[]>(
        `/api/v1/member/shifts/available?branch_id=${branchId}`
      );
      return res.data ?? [];
    },
    refetchInterval: 30_000,
    enabled: !!branchId,
  });

  const checkInMutation = useMutation({
    mutationFn: async ({
      shiftId,
      weightKg,
      measurementSource,
    }: {
      shiftId: string;
      weightKg: number;
      measurementSource: string;
    }) => {
      const res = await authorizedRequest<unknown>("/api/v1/member/check-in", {
        method: "POST",
        body: JSON.stringify({ shiftId, branchId, weightKg, measurementSource }),
      });
      return res.data;
    },
    onSuccess: (data: unknown) => {
      toast.success("Điểm danh thành công! 🎉");
      setCheckInSuccess(true);
      void queryClient.invalidateQueries({ queryKey: ["member-available-shifts"] });
      const d = data as { sessionsRemaining?: number };
      if (d?.sessionsRemaining !== undefined) {
        toast.info(`Còn lại ${d.sessionsRemaining} buổi tập`);
      }
      setTimeout(() => {
        setSelectedShift(null);
        setCheckInSuccess(false);
      }, 2200);
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

  function handleOpenSheet(shift: Shift) {
    setCheckInSuccess(false);
    setSelectedShift(shift);
  }

  const todayShifts = shiftsQuery.data ?? [];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--off-white)" }}
    >
      <div
        className="sticky top-0 z-10 px-4 pt-safe"
        style={{
          background: "linear-gradient(135deg, var(--primary-pink) 0%, var(--deep-pink) 100%)",
        }}
      >
        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-white/70 text-xs font-medium">Hội viên</p>
            <h1 className="text-white text-xl font-bold">Điểm danh ca</h1>
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}
          >
            {avatarInitials}
          </div>
        </div>

        <div
          className="flex gap-2 pb-4 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {datePills.map((pill) => {
            const isSelected = pill.key === selectedDateKey;
            return (
              <button
                key={pill.key}
                onClick={() => setSelectedDateKey(pill.key)}
                className="flex-shrink-0 flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 transition-all"
                style={
                  isSelected || pill.isToday
                    ? {
                        background: "#fff",
                        color: "var(--primary-pink)",
                        minWidth: 48,
                      }
                    : {
                        background: "transparent",
                        color: "rgba(255,255,255,0.75)",
                        minWidth: 48,
                      }
                }
              >
                <span className="text-[10px] font-semibold uppercase">
                  {pill.dayAbbr}
                </span>
                <span className="text-sm font-bold">{pill.dayNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {!branchId ? (
          <div
            className="rounded-2xl p-6 text-center myfit-surface"
          >
            <div
              className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "var(--pastel-pink)" }}
            >
              <Dumbbell
                className="h-7 w-7"
                style={{ color: "var(--primary-pink)" }}
              />
            </div>
            <h3
              className="text-base font-bold mb-1"
              style={{ color: "var(--black)" }}
            >
              Chưa có chi nhánh
            </h3>
            <p
              className="text-sm"
              style={{ color: "var(--gray-500)" }}
            >
              Tài khoản của bạn chưa được gán chi nhánh. Liên hệ quản lý để được hỗ trợ.
            </p>
          </div>
        ) : shiftsQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse"
                style={{ background: "var(--gray-100)" }}
              />
            ))}
          </div>
        ) : shiftsQuery.isError ? (
          <div
            className="rounded-2xl p-4 text-sm font-medium"
            style={{ background: "#FFF1F2", color: "var(--rose-error)" }}
          >
            Không tải được danh sách ca. Thử lại sau.
          </div>
        ) : todayShifts.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center myfit-surface"
          >
            <div
              className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "var(--pastel-pink)" }}
            >
              <Clock
                className="h-7 w-7"
                style={{ color: "var(--primary-pink)" }}
              />
            </div>
            <h3
              className="text-base font-bold mb-1"
              style={{ color: "var(--black)" }}
            >
              Không có ca điểm danh
            </h3>
            <p
              className="text-sm"
              style={{ color: "var(--gray-500)" }}
            >
              Hiện không có ca nào trong cửa sổ điểm danh (30 phút trước đến khi kết thúc ca).
            </p>
          </div>
        ) : (
          todayShifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              onCheckIn={handleOpenSheet}
            />
          ))
        )}
      </div>

      {selectedShift && (
        <CheckInBottomSheet
          shift={selectedShift}
          onClose={() => {
            if (!checkInMutation.isPending) {
              setSelectedShift(null);
              setCheckInSuccess(false);
            }
          }}
          onConfirm={handleConfirm}
          loading={checkInMutation.isPending}
          success={checkInSuccess}
        />
      )}
    </div>
  );
}
