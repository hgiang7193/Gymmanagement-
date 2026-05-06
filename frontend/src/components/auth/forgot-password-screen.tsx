"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/ui/auth-shell";
import { apiRequest } from "@/lib/api/client";

function ProgressSteps({ active }: { active: 1 | 2 | 3 }) {
  const steps = ["Nhập email", "Xác minh", "Đặt mật khẩu mới"];
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((label, index) => {
          const number = index + 1;
          const done = number < active;
          const isActive = number === active;
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${done || isActive ? "bg-[var(--primary-pink)] text-white" : "bg-[var(--gray-100)] text-[var(--gray-500)]"}`}>
                {number}
              </div>
              {index < steps.length - 1 ? <div className={`mx-2 h-0.5 flex-1 ${done ? "bg-[var(--primary-pink)]" : "bg-[var(--gray-100)]"}`} /> : null}
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-[var(--gray-500)]">
        {steps.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!sent || countdown <= 0) return;
    const timer = globalThis.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => globalThis.clearTimeout(timer);
  }, [sent, countdown]);

  async function requestReset(event: FormEvent<HTMLFormElement> | null) {
    event?.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest("/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // Always show success to prevent email enumeration.
    } finally {
      setSubmitting(false);
      setSent(true);
      setCountdown(60);
    }
  }

  return (
    <AuthShell title="Khôi phục mật khẩu" subtitle="Lấy lại quyền truy cập tài khoản">
      <ProgressSteps active={sent ? 2 : 1} />
      {!sent ? (
        <>
          <h2 className="text-2xl font-bold text-[var(--black)]">Khôi phục mật khẩu</h2>
          <p className="mt-2 text-sm text-[var(--gray-500)]">Nhập email đã đăng ký, chúng tôi sẽ gửi link khôi phục.</p>

          <form className="mt-6 space-y-5" onSubmit={requestReset}>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--gray-500)]">Email đăng ký</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="myfit-input"
                placeholder="email@example.com"
                autoComplete="email"
                required
              />
            </label>

            <button type="submit" disabled={submitting} className="myfit-btn-primary h-14 w-full text-base">
              {submitting ? "Đang gửi..." : "Gửi link"}
            </button>
          </form>
        </>
      ) : (
        <div className="rounded-2xl border border-[var(--blush)] bg-[var(--pastel-pink)] px-5 py-6 text-center">
          <Mail className="mx-auto h-10 w-10 animate-[bounce_1.5s_ease-in-out_infinite] text-[var(--primary-pink)]" />
          <h2 className="mt-3 text-2xl font-bold text-[var(--black)]">Đã gửi email!</h2>
          <p className="mt-2 text-sm text-[var(--gray-500)]">Kiểm tra hộp thư (và spam). Link có hiệu lực 24 giờ.</p>
          <button
            type="button"
            onClick={() => void requestReset(null)}
            disabled={countdown > 0 || submitting}
            className="mt-5 text-sm font-semibold text-[var(--primary-pink)] disabled:cursor-not-allowed disabled:text-[var(--gray-300)]"
          >
            {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại"}
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-[var(--gray-500)]">
        <Link href="/login" className="font-semibold text-[var(--primary-pink)] hover:underline">
          Quay về đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
