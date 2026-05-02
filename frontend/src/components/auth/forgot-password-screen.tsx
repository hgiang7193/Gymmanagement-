"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";
import { apiRequest } from "@/lib/api/client";

export function ForgotPasswordScreen() {
  const [email, setEmail]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent]         = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest("/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      // Always show success to avoid email enumeration (UC-AUTH-04)
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role="GUEST" title="Quên mật khẩu" description="Đặt lại mật khẩu qua email.">
      <ScreenIntro eyebrow="Auth" title="Quên mật khẩu" body="Nhập email đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu nếu tài khoản tồn tại." />
      <div className="max-w-md mx-auto">
        <SurfaceCard title="Yêu cầu đặt lại mật khẩu">
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-slate-700">
                Nếu email <strong>{email}</strong> tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.
              </p>
              <p className="text-sm text-slate-500">Kiểm tra cả hộp thư spam nếu không thấy email.</p>
              <Link href="/login" className="block font-medium text-amber-600 hover:underline">
                Quay về đăng nhập
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-800">Email đăng ký *</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-400"
                  placeholder="email@example.com"
                  autoComplete="email"
                />
              </label>
              <button
                disabled={submitting}
                type="submit"
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitting ? "Đang gửi..." : "Gửi link đặt lại"}
              </button>
              <p className="text-center text-sm text-slate-600">
                <Link href="/login" className="font-medium text-amber-600 hover:underline">
                  Quay về đăng nhập
                </Link>
              </p>
            </form>
          )}
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
