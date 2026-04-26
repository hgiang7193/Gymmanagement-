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
          <SurfaceCard title="Dang khoi phuc session" description="Frontend dang kiem tra refresh token va role truy cap.">
            <p className="text-sm text-slate-600">Vui long doi trong giay lat...</p>
          </SurfaceCard>
        </div>
      </div>
    );
  }

  if (!session || !allowedRoles.includes(session.role)) {
    return null;
  }

  return (
    <>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pt-6 text-sm text-slate-600 lg:px-8">
        <div>
          Dang nhap voi role <span className="font-semibold text-slate-900">{session.role}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="font-medium text-amber-700 hover:text-amber-800">Trang cong khai</Link>
          <button type="button" onClick={() => void logout()} className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-100">
            Dang xuat
          </button>
        </div>
      </div>
      {children}
    </>
  );
}
