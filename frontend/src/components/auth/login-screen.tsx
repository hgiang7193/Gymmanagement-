"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppShell, EndpointPreview, ScreenIntro } from "@/components/layout/app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/lib/api/types";

const roleHome: Record<UserRole, string> = {
  ADMIN: "/admin/branches",
  MANAGER: "/manager/branches",
  MEMBER: "/member/subscription",
  GUEST: "/",
};

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isHydrating, session } = useAuth();
  const [email, setEmail] = useState("admin@myfit.local");
  const [password, setPassword] = useState("AdminPass123");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget = useMemo(() => searchParams.get("redirect"), [searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const role = await login({ email, password });
      toast.success("Dang nhap thanh cong");
      router.push(redirectTarget || roleHome[role]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login that bai";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell role="GUEST" title="Login" description="Buoc tiep theo la noi form nay vao auth client that va token rotation.">
      <ScreenIntro
        eyebrow="Auth"
        title="Dang nhap he thong"
        body="Frontend da khoa auth strategy theo JSON token flow. Screen nay da duoc noi vao backend auth that."
      />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SurfaceCard title="Form login" description="Mac dinh dang preload tai khoan seed local de smoke nhanh.">
          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-slate-800">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-400"
                placeholder="admin@myfit.local"
                type="email"
                autoComplete="email"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-slate-800">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-400"
                placeholder="AdminPass123"
                type="password"
                autoComplete="current-password"
              />
            </label>

            <button
              disabled={isSubmitting || isHydrating}
              type="submit"
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "Dang dang nhap..." : session ? "Dang nhap lai" : "Dang nhap"}
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Integration notes" description="Contract dang duoc frontend dua vao ngay tu phase dau.">
          <div className="space-y-3">
            <EndpointPreview method="POST" endpoint="/api/v1/auth/login" notes="Nhan email + password, tra accessToken va refreshToken." />
            <EndpointPreview method="POST" endpoint="/api/v1/auth/refresh" notes="Rotate refresh token khi access token het han hoac sau reload." />
            <EndpointPreview method="POST" endpoint="/api/v1/auth/logout" notes="Revoke session dua tren refresh token hien tai." />
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
