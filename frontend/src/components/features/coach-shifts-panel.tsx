"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";
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
  MORNING_1: "Sáng 1 (05:30-06:30)",
  MORNING_2: "Sáng 2 (06:30-07:30)",
  AFTERNOON_1: "Chiều 1 (16:30-17:30)",
  AFTERNOON_2: "Chiều 2 (17:30-18:30)",
  EVENING_1: "Tối 1 (18:30-19:30)",
  EVENING_2: "Tối 2 (19:30-20:30)",
};

function formatTime(isoString: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(isoString));
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr));
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!isRecord(value)) return false;
  return value.error === undefined || value.error === null || isRecord(value.error);
}

function getErrorCode(error: unknown) {
  if (error instanceof ApiRequestError) {
    return error.code ?? error.message;
  }

  if (isApiErrorResponse(error) && typeof error.error?.code === "string") {
    return error.error.code;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "UNKNOWN_ERROR";
}

export function CoachShiftsPanel() {
  const { authorizedRequest, session } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [branchId] = useState(session?.branchIds?.[0] || "");

  // Fetch shifts
  const shiftsQuery = useQuery({
    queryKey: ["coach-shifts", branchId, selectedDate],
    queryFn: async () => {
      if (!branchId) return null;
      const response = await authorizedRequest<ShiftsResponse>(
        `/api/v1/coach/shifts?branch_id=${branchId}&date=${selectedDate}`
      );
      return response.data;
    },
    enabled: !!branchId,
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      const response = await authorizedRequest(
        `/api/v1/coach/shifts/${shiftId}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: "" }),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["coach-shifts"] });
    },
    onError: (error: unknown) => {
      const errorCode = getErrorCode(error);
      if (errorCode === "SHIFT_COACH_CAPACITY_REACHED") {
        alert("Ca nay da du 3 HLV, khong the dang ky them!");
      } else if (errorCode === "SHIFT_ALREADY_STARTED") {
        alert("Ca nay da bat dau, khong the thay doi!");
      } else if (errorCode === "SHIFT_ASSIGNMENT_EXISTS") {
        alert("Ban da dang ky ca nay roi!");
      } else {
        alert(`Loi: ${errorCode}`);
      }
    },
  });

  // Unassign mutation
  const unassignMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      const response = await authorizedRequest(
        `/api/v1/coach/shifts/${shiftId}/assign`,
        {
          method: "DELETE",
        }
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["coach-shifts"] });
    },
    onError: (error: unknown) => {
      const errorCode = getErrorCode(error);
      if (errorCode === "SHIFT_REQUIRES_AT_LEAST_ONE_COACH") {
        alert("Khong the huy vi ca nay can it nhat 1 HLV!");
      } else if (errorCode === "SHIFT_ALREADY_STARTED") {
        alert("Ca nay da bat dau, khong the thay doi!");
      } else {
        alert(`Loi: ${errorCode}`);
      }
    },
  });

  const handleAssign = (shiftId: string) => {
    if (confirm("Ban co chan chan muon dang ky ca nay?")) {
      assignMutation.mutate(shiftId);
    }
  };

  const handleUnassign = (shiftId: string) => {
    if (confirm("Ban co chan chan muon huy dang ky ca nay?")) {
      unassignMutation.mutate(shiftId);
    }
  };

  if (!branchId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          Ban chua duoc gan vao branch nao. Lien he quan ly de duoc cap quyen.
        </p>
      </div>
    );
  }

  if (shiftsQuery.isLoading) {
    return <p className="text-sm text-slate-600">Dang tai lich ca tap...</p>;
  }

  if (shiftsQuery.isError) {
    return <p className="text-sm text-rose-600">Khong tai duoc lich. Vui long thu lai.</p>;
  }

  const data = shiftsQuery.data;
  if (!data || !data.shifts || data.shifts.length === 0) {
    return <p className="text-sm text-slate-600">Khong co ca tap nao cho ngay nay.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Date selector */}
      <div className="flex items-center gap-4">
        <label htmlFor="date" className="text-sm font-medium text-slate-700">
          Chon ngay:
        </label>
        <input
          type="date"
          id="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-sm text-slate-500">{formatDate(selectedDate)}</span>
      </div>

      {/* Shifts list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.shifts.map((shift) => (
          <SurfaceCard
            key={shift.shiftId}
            title={SHIFT_LABELS[shift.shiftCode] || shift.shiftCode}
            description={`${formatTime(shift.startAt)} - ${formatTime(shift.endAt)}`}
          >
            <div className="space-y-3">
              {/* Stats */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">HLV da dang ky:</span>
                <span className={`font-semibold ${shift.isFull ? "text-rose-600" : "text-emerald-600"}`}>
                  {shift.coachCount}/{shift.coachCapacity}
                </span>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                {shift.isAssigned && (
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                    Da dang ky
                  </span>
                )}
                {shift.isFull && (
                  <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                    Day
                  </span>
                )}
                {shift.isLocked && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                    Da khoa
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                {!shift.isAssigned && !shift.isFull && !shift.isLocked ? (
                  <button
                    onClick={() => handleAssign(shift.shiftId)}
                    disabled={assignMutation.isPending}
                    className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {assignMutation.isPending ? "Dang xu ly..." : "Dang ky ca nay"}
                  </button>
                ) : shift.isAssigned && !shift.isLocked ? (
                  <button
                    onClick={() => handleUnassign(shift.shiftId)}
                    disabled={unassignMutation.isPending}
                    className="w-full rounded-md border border-rose-600 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {unassignMutation.isPending ? "Dang xu ly..." : "Huy dang ky"}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400"
                  >
                    {shift.isLocked ? "Da het han dang ky" : "Khong the thao tac"}
                  </button>
                )}
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
