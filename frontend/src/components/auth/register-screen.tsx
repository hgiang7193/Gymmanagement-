"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";
import { apiRequest } from "@/lib/api/client";

export function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
      await apiRequest("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, email, password, phoneNumber: phone || undefined }),
      });
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role="GUEST" title="Đăng ký" description="Tạo tài khoản MYFIT mới.">
      <ScreenIntro eyebrow="Auth" title="Tạo tài khoản" body="Điền thông tin để tạo tài khoản Guest. Sau khi xác minh email, bạn có thể đặt lịch tập thử." />
      <div className="max-w-md mx-auto">
        <SurfaceCard title="Thông tin đăng ký">
          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-800">Họ tên *</span>
              <input
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-400"
                placeholder="Nguyễn Văn A"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-800">Email *</span>
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
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-800">Số điện thoại</span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-400"
                placeholder="0912345678"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-800">Mật khẩu *</span>
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
              className="w-full rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "Đang đăng ký..." : "Đăng ký"}
            </button>
            <p className="text-center text-sm text-slate-600">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-medium text-amber-600 hover:underline">
                Đăng nhập
              </Link>
            </p>
          </form>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
