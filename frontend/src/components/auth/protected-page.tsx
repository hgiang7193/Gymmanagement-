"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { UserRole } from "@/lib/api/types";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

export function ProtectedPage({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isHydrating, logout } = useAuth();

  useEffect(() => {
    if (isHydrating) return;
    if (!session) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!allowedRoles.includes(session.role)) {
      router.replace("/");
    }
  }, [allowedRoles, isHydrating, pathname, router, session]);

  if (isHydrating) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <SurfaceCard title="Đang khôi phục phiên đăng nhập" description="Frontend đang kiểm tra refresh token và quyền truy cập.">
            <p className="text-sm text-slate-600">Vui lòng đợi trong giây lát...</p>
          </SurfaceCard>
        </div>
      </div>
    );
  }

  if (!session || !allowedRoles.includes(session.role)) {
    return null;
  }

  const isMember = session.role === "MEMBER";

  return (
    <>
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-4 pt-6 text-sm lg:px-8 ${
          isMember ? "text-[var(--gray-500)]" : "text-slate-600"
        }`}
      >
        <div>
          Đăng nhập:{" "}
          <span className={`font-semibold ${isMember ? "text-[var(--deep-pink)]" : "text-slate-900"}`}>
            {session.role}
          </span>
          {isMember ? <span className="hidden sm:inline"> · Khu vực hội viên</span> : null}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className={`font-medium transition ${
              isMember ? "text-[var(--primary-pink)] hover:text-[var(--deep-pink)]" : "text-amber-700 hover:text-amber-800"
            }`}
          >
            Trang khách
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className={`rounded-full border px-4 py-2 font-medium transition ${
              isMember
                ? "border-[var(--blush)] text-[var(--charcoal)] hover:border-[var(--primary-pink)] hover:bg-[var(--pastel-pink)]"
                : "border-slate-300 text-slate-800 hover:border-slate-400 hover:bg-slate-100"
            }`}
          >
            Đăng xuất
          </button>
        </div>
      </div>
      {children}
    </>
  );
}
