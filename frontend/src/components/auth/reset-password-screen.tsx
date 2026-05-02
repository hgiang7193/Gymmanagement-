"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";
import { apiRequest } from "@/lib/api/client";

export function ResetPasswordScreen() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      toast.error("Link không hợp lệ. Vui lòng yêu cầu gửi lại email.");
      return;
    }
    if (password !== confirm) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password }),
      });
      toast.success("Đặt lại mật khẩu thành công!");
      router.push("/login");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại";
      toast.error(msg === "INVALID_RESET_TOKEN" ? "Link đã hết hạn hoặc đã được sử dụng." : msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AppShell role="GUEST" title="Đặt lại mật khẩu" description="Yêu cầu link đặt lại mới nếu link cũ đã hết hạn.">
        <div className="max-w-md mx-auto">
          <SurfaceCard title="Link không hợp lệ">
            <p className="text-slate-600 mb-4">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
            <Link href="/forgot-password" className="font-medium text-amber-600 hover:underline">
              Yêu cầu gửi lại email
            </Link>
          </SurfaceCard>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="GUEST" title="Đặt lại mật khẩu" description="Tạo mật khẩu mới cho tài khoản của bạn.">
      <ScreenIntro eyebrow="Auth" title="Đặt mật khẩu mới" body="Nhập mật khẩu mới. Sau khi đặt lại, tất cả phiên đang nhập sẽ bị đăng xuất." />
      <div className="max-w-md mx-auto">
        <SurfaceCard title="Mật khẩu mới">
          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-800">Mật khẩu mới *</span>
              <input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-400"
                placeholder="Ít nhất 8 ký tự"
                autoComplete="new-password"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-800">Xác nhận mật khẩu *</span>
              <input
                required
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-400"
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
              />
            </label>
            <button
              disabled={submitting}
              type="submit"
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "Đang lưu..." : "Đặt lại mật khẩu"}
            </button>
          </form>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
