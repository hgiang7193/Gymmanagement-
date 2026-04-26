"use client";

import { ProtectedPage } from "@/components/auth/protected-page";
import { CoachShiftsPanel } from "@/components/features/coach-shifts-panel";

export default function CoachShiftsPage() {
  return (
    <ProtectedPage allowedRoles={["COACH", "ADMIN"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lich Ca Tap</h1>
          <p className="mt-1 text-sm text-slate-600">
            Xem va dang ky ca day trong tuan
          </p>
        </div>

        <CoachShiftsPanel />
      </div>
    </ProtectedPage>
  );
}
