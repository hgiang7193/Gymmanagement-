"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Eye, EyeOff, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/ui/auth-shell";
import { apiRequest } from "@/lib/api/client";

type PasswordStrength = "weak" | "medium" | "good" | "strong";

function computePasswordStrength(password: string): PasswordStrength {
  const score =
    Number(password.length >= 8) +
    Number(/[A-Z]/.test(password)) +
    Number(/[a-z]/.test(password)) +
    Number(/[0-9]/.test(password));

  if (score <= 1) return "weak";
  if (score === 2) return "medium";
  if (score === 3) return "good";
  return "strong";
}

export function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const hasTypedEmail = email.trim().length > 0;
  const passwordStrength = useMemo(() => computePasswordStrength(password), [password]);
  const passwordValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  const confirmInvalid = confirm.length > 0 && confirm !== password;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!emailValid) {
      toast.error("Email không hợp lệ.");
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
      await apiRequest("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          phoneNumber: phone.trim() ? `+84${phone.trim().replace(/^0/, "")}` : undefined,
        }),
      });
      toast.success("Tạo tài khoản thành công. Vui lòng kiểm tra email xác minh.");
      router.push("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đăng ký thất bại";
      if (message.includes("EMAIL") || message.includes("EXIST")) {
        toast.error("Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.");
        return;
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Tạo tài khoản" subtitle="Bắt đầu hành trình của bạn">
      <form className="space-y-5" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--gray-500)]">Họ và tên</span>
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-300)]" />
            <input
              className="myfit-input pl-11"
              placeholder="Nguyễn Thị A"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--gray-500)]">Email</span>
          <div className="relative">
            <Mail
              className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${
                hasTypedEmail && !emailValid ? "text-[var(--rose-error)]" : "text-[var(--gray-300)]"
              }`}
            />
            <input
              type="email"
              autoComplete="email"
              className={`myfit-input pl-11 ${hasTypedEmail && !emailValid ? "border-[var(--rose-error)] focus:shadow-[0_0_0_4px_rgba(251,113,133,0.15)]" : ""}`}
              placeholder="email@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          {hasTypedEmail && !emailValid ? <p className="mt-1 text-xs text-[var(--rose-error)]">Email chưa đúng định dạng.</p> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--gray-500)]">Số điện thoại</span>
          <div className="flex items-center gap-2">
            <div className="flex h-[52px] min-w-[72px] items-center justify-center rounded-lg bg-[var(--gray-100)] text-sm font-semibold text-[var(--gray-500)]">+84</div>
            <div className="relative flex-1">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-300)]" />
              <input
                type="tel"
                className="myfit-input pl-11"
                placeholder="912345678"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--gray-500)]">Mật khẩu</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`myfit-input pr-11 ${password.length > 0 && !passwordValid ? "border-[var(--rose-error)] focus:shadow-[0_0_0_4px_rgba(251,113,133,0.15)]" : ""}`}
              placeholder="Ít nhất 8 ký tự"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-500)] hover:text-[var(--primary-pink)]"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((segment) => {
              const palette =
                passwordStrength === "weak"
                  ? "bg-[var(--rose-error)]"
                  : passwordStrength === "medium"
                    ? "bg-[var(--peach)]"
                    : passwordStrength === "good"
                      ? "bg-[var(--soft-pink)]"
                      : "bg-[var(--primary-pink)]";
              const activeSegments = passwordStrength === "weak" ? 1 : passwordStrength === "medium" ? 2 : passwordStrength === "good" ? 3 : 4;
              return <span key={segment} className={`h-1.5 rounded-full ${segment < activeSegments ? palette : "bg-[var(--gray-100)]"} ${passwordStrength === "strong" ? "animate-pulse" : ""}`} />;
            })}
          </div>

          <p className="mt-1 text-[11px] text-[var(--gray-500)]">Ít nhất 8 ký tự, chữ hoa, số</p>
          {password.length > 0 && !passwordValid ? (
            <div className="mt-1 text-xs text-[var(--rose-error)]">
              <p>Cần thêm:</p>
              <ul className="mt-0.5 list-disc pl-4">
                {password.length < 8 ? <li>Ít nhất 8 ký tự</li> : null}
                {!/[A-Z]/.test(password) ? <li>Ít nhất 1 chữ in hoa</li> : null}
                {!/[0-9]/.test(password) ? <li>Ít nhất 1 chữ số</li> : null}
              </ul>
            </div>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--gray-500)]">Xác nhận mật khẩu</span>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              className={`myfit-input pr-11 ${confirmInvalid ? "border-[var(--rose-error)] focus:shadow-[0_0_0_4px_rgba(251,113,133,0.15)]" : ""}`}
              placeholder="Nhập lại mật khẩu"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-500)] hover:text-[var(--primary-pink)]"
              aria-label={showConfirm ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmInvalid ? <p className="mt-1 text-xs text-[var(--rose-error)]">Mật khẩu xác nhận chưa khớp.</p> : null}
        </label>

        <button type="submit" disabled={submitting} className="myfit-btn-primary flex h-14 w-full items-center justify-center gap-2 text-base">
          {submitting ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/50 border-t-white" /> : null}
          <span className={submitting ? "sr-only" : ""}>Tạo tài khoản</span>
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--gray-100)]" />
        <span className="text-xs text-[var(--gray-500)]">hoặc</span>
        <div className="h-px flex-1 bg-[var(--gray-100)]" />
      </div>

      <button
        type="button"
        onClick={() => toast.info("Tích hợp Google OAuth sẽ được bật ở bước tiếp theo.")}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--gray-100)] bg-white text-sm font-medium text-[var(--black)] hover:border-[var(--soft-pink)] hover:bg-[var(--pastel-pink)]"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--gray-300)] text-[11px] font-bold text-[#ea4335]">G</span>
        Tiếp tục với Google
      </button>

      <p className="mt-6 text-center text-sm text-[var(--gray-500)]">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-[var(--primary-pink)] hover:underline">
          Đăng nhập
        </Link>
      </p>

      <p className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--peach)]/45 px-3 py-2 text-xs text-[var(--black)]">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--deep-pink)]" />
        Nếu email đã tồn tại, hệ thống sẽ yêu cầu bạn chuyển sang đăng nhập để bảo mật tài khoản.
      </p>
    </AuthShell>
  );
}
