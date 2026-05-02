"use client";

import Link from "next/link";
import { ProtectedPage } from "@/components/auth/protected-page";
import { SurfaceCard } from "@/components/ui/surface-card";
import { CoachProxyCheckInPanel } from "@/components/features/coach-proxy-checkin-panel";

export default function CoachDashboardPage() {
  return (
    <ProtectedPage allowedRoles={["COACH", "ADMIN"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Xin chao HLV</h1>
          <p className="mt-1 text-sm text-slate-600">
            Trang chu huan luyen vien
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/coach/shifts" className="block">
            <SurfaceCard
              title="Lich Ca Tap"
              description="Xem va dang ky ca day trong tuan"
              className="cursor-pointer transition-shadow hover:shadow-lg"
            >
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  Dang ky ca sang, chieu, toi
                </span>
                <svg
                  className="h-5 w-5 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </SurfaceCard>
          </Link>

          <SurfaceCard
            title="Thong Tin Ca Nhan"
            description="Cap nhat thong tin HLV"
          >
            <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-600">
                Tinh nang dang phat trien...
              </p>
            </div>
          </SurfaceCard>
        </div>

        <CoachProxyCheckInPanel />

        {/* Quick info */}
        <SurfaceCard
          title="Quy Dinh Ca Tap"
          description="Cac luu y quan trong khi dang ky ca"
        >
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
              <span>Moi ca co toi da <strong>3 HLV</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
              <span>Moi ca can it nhat <strong>1 HLV</strong> de duy tri</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
              <span>Khong the thay doi sau khi ca <strong>da bat dau</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
              <span>Ca sang: 05:30-06:30, 06:30-07:30</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
              <span>Ca chieu: 16:30-17:30, 17:30-18:30</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
              <span>Ca toi: 18:30-19:30, 19:30-20:30</span>
            </li>
          </ul>
        </SurfaceCard>
      </div>
    </ProtectedPage>
  );
}
