"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/ui/auth-shell";
import { apiRequest } from "@/lib/api/client";

function ProgressSteps() {
  const steps = ["Nhập email", "Xác minh", "Đặt mật khẩu mới"];
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((label, index) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-pink)] text-xs font-semibold text-white">{index + 1}</div>
            {index < steps.length - 1 ? <div className="mx-2 h-0.5 flex-1 bg-[var(--primary-pink)]" /> : null}
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-[var(--gray-500)]">
        {steps.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

export function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [logoutOthers, setLogoutOthers] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordValid = useMemo(() => password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password), [password]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      toast.error("Link không hợp lệ. Vui lòng yêu cầu gửi lại email.");
      return;
    }
    if (!passwordValid) {
      toast.error("Mật khẩu chưa đạt yêu cầu bảo mật.");
      return;
    }
    if (password !== confirm) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          newPassword: password,
          logoutOtherDevices: logoutOthers,
        }),
      });
      setSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đặt lại mật khẩu thất bại";
      toast.error(message.includes("INVALID_RESET_TOKEN") ? "Link đã hết hạn hoặc đã được sử dụng." : message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Đặt mật khẩu mới" subtitle="Link không hợp lệ">
        <div className="rounded-2xl border border-[var(--blush)] bg-[var(--pastel-pink)] px-5 py-6 text-center">
          <h2 className="text-xl font-bold text-[var(--black)]">Link không hợp lệ</h2>
          <p className="mt-2 text-sm text-[var(--gray-500)]">Link đặt lại mật khẩu đã hết hạn hoặc không tồn tại.</p>
          <Link href="/forgot-password" className="mt-5 inline-block font-semibold text-[var(--primary-pink)] hover:underline">
            Yêu cầu gửi lại email
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell title="Thành công" subtitle="Mật khẩu đã được cập nhật">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-[var(--primary-pink)]" />
          <h2 className="mt-3 text-2xl font-bold text-[var(--black)]">Thành công!</h2>
          <p className="mt-2 text-sm text-[var(--gray-500)]">Mật khẩu đã đổi. Vui lòng đăng nhập lại.</p>
          <button onClick={() => router.push("/login")} className="myfit-btn-primary mt-6 h-14 w-full text-base">
            Đăng nhập ngay
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Đặt mật khẩu mới" subtitle="Hoàn tất khôi phục tài khoản">
      <ProgressSteps />
      {submitting ? (
        <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-[var(--pastel-pink)] px-4 py-3 text-sm font-medium text-[var(--primary-pink)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang xác minh...
        </div>
      ) : null}
      <h2 className="text-2xl font-bold text-[var(--black)]">Tạo mật khẩu mới</h2>
      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--gray-500)]">Mật khẩu mới</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="myfit-input pr-11"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-500)] hover:text-[var(--primary-pink)]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--gray-500)]">Xác nhận mật khẩu</span>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              className="myfit-input pr-11"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-500)] hover:text-[var(--primary-pink)]"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        <label className="flex items-center gap-2.5 text-sm text-[var(--gray-500)]">
          <span className={`relative inline-flex h-5 w-5 items-center justify-center rounded-md border-2 ${logoutOthers ? "border-[var(--primary-pink)] bg-[var(--primary-pink)]" : "border-[var(--gray-300)] bg-white"}`}>
            <input type="checkbox" checked={logoutOthers} onChange={(event) => setLogoutOthers(event.target.checked)} className="absolute inset-0 opacity-0" />
            <span className={`h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-white ${logoutOthers ? "opacity-100" : "opacity-0"}`} />
          </span>
          Đăng xuất khỏi tất cả thiết bị
        </label>
        <button type="submit" disabled={submitting} className="myfit-btn-primary h-14 w-full text-base">
          Xác nhận
        </button>
      </form>
    </AuthShell>
  );
}
