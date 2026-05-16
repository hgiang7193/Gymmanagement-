"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/lib/api/types";
import { AuthShell } from "@/components/ui/auth-shell";

const roleHome: Record<UserRole, string> = {
  ADMIN: "/admin/branches",
  MANAGER: "/manager/branches",
  COACH: "/coach",
  MEMBER: "/member",
  GUEST: "/",
};

const emailSuggestions = ["@gmail.com", "@yahoo.com", "@outlook.com"];

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isHydrating } = useAuth();

  const [email, setEmail] = useState("admin@myfit.vn");
  const [password, setPassword] = useState("Admin@2026!");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorPulse, setErrorPulse] = useState(false);

  const redirectTarget = useMemo(() => searchParams.get("redirect"), [searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorPulse(false);
    try {
      const role = await login({ email: email.trim(), password });
      const previousRoles = globalThis.localStorage.getItem("myfit_role_history");
      const next = Array.from(new Set([role, ...(previousRoles ? previousRoles.split(",") : [])]));
      globalThis.localStorage.setItem("myfit_role_history", next.join(","));
      globalThis.localStorage.setItem("myfit_remember_login", remember ? "1" : "0");
      toast.success("Đăng nhập thành công.");
      router.push(redirectTarget || roleHome[role]);
    } catch {
      setErrorPulse(true);
      toast.error("Thông tin đăng nhập không chính xác.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Đăng nhập" subtitle="Chào mừng bạn quay lại" cardPaddingClassName="p-8">
      <form className="space-y-5" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--gray-500)]">Email</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-300)]" />
            <input
              type="email"
              autoComplete="email"
              className="myfit-input rounded-2xl pl-11"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              list="login-email-suggestions"
              required
            />
            <datalist id="login-email-suggestions">
              {emailSuggestions.map((suffix) => {
                const local = email.includes("@") ? email.slice(0, email.indexOf("@")) : email;
                if (!local) return null;
                return <option key={suffix} value={`${local}${suffix}`} />;
              })}
            </datalist>
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--gray-500)]">
            <span>Mật khẩu</span>
            <Link href="/forgot-password" className="text-[11px] normal-case tracking-normal text-[var(--primary-pink)] hover:underline">
              Quên mật khẩu?
            </Link>
          </span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-300)]" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`myfit-input rounded-2xl pl-11 pr-12 ${errorPulse ? "border-[var(--rose-error)] animate-[shake_0.35s_ease-in-out]" : ""}`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--gray-500)] transition-colors hover:text-[var(--primary-pink)]"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errorPulse ? (
            <p className="mt-1.5 text-xs text-[var(--rose-error)]">Thông tin đăng nhập không chính xác.</p>
          ) : null}
        </label>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--gray-500)]">
          <span
            className={`relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
              remember
                ? "border-[var(--primary-pink)] bg-[var(--primary-pink)]"
                : "border-[var(--gray-300)] bg-white hover:border-[var(--primary-pink)]"
            }`}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <span
              className={`h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-white transition-opacity ${
                remember ? "opacity-100" : "opacity-0"
              }`}
            />
          </span>
          Ghi nhớ đăng nhập
        </label>

        <button
          type="submit"
          disabled={submitting || isHydrating}
          className="myfit-btn-primary flex h-14 w-full items-center justify-center gap-2 text-base font-bold"
        >
          {submitting ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : null}
          <span>{submitting ? "Đang đăng nhập..." : "Đăng nhập"}</span>
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--gray-500)]">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-semibold text-[var(--primary-pink)] hover:underline">
          Đăng ký
        </Link>
      </p>
    </AuthShell>
  );
}
