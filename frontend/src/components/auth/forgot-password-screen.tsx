"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Mail } from "lucide-react";
import { AuthShell } from "@/components/ui/auth-shell";
import { apiRequest } from "@/lib/api/client";

const STEPS = [
  { label: "Email" },
  { label: "Xác thực" },
  { label: "Mật khẩu mới" },
];

function StepIndicator({ active }: { active: 1 | 2 | 3 }) {
  return (
    <div className="mb-8 flex items-center">
      {STEPS.map((step, i) => {
        const number = i + 1;
        const isDone = number < active;
        const isActive = number === active;
        return (
          <div key={step.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                style={
                  isDone
                    ? { background: "#10b981", color: "#fff" }
                    : isActive
                    ? {
                        background: "var(--primary-pink)",
                        color: "#fff",
                        boxShadow: "0 0 0 4px rgba(255,107,157,0.22)",
                      }
                    : {
                        background: "var(--gray-100)",
                        color: "var(--gray-500)",
                      }
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all"
              >
                {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : number}
              </div>
              <span
                className="text-[10px] font-semibold whitespace-nowrap"
                style={{
                  color: isDone || isActive ? "var(--primary-pink)" : "var(--gray-500)",
                }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="mx-2 mb-5 h-0.5 flex-1 transition-colors"
                style={{ background: isDone ? "var(--primary-pink)" : "var(--gray-100)" }}
              />
            )}
          </div>
        );
      })}
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
    const timer = globalThis.setTimeout(() => setCountdown((v) => v - 1), 1000);
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
    } finally {
      setSubmitting(false);
      setSent(true);
      setCountdown(60);
    }
  }

  return (
    <AuthShell title="Khôi phục mật khẩu" subtitle="Lấy lại quyền truy cập tài khoản" cardPaddingClassName="p-8">
      <StepIndicator active={sent ? 2 : 1} />

      {!sent ? (
        <>
          <h2 className="text-xl font-bold" style={{ color: "var(--black)" }}>
            Quên mật khẩu?
          </h2>
          <p className="mt-1.5 text-sm" style={{ color: "var(--gray-500)" }}>
            Nhập email đã đăng ký, chúng tôi sẽ gửi link khôi phục.
          </p>

          <form className="mt-6 space-y-5" onSubmit={requestReset}>
            <label className="block">
              <span
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em]"
                style={{ color: "var(--gray-500)" }}
              >
                Email đăng ký
              </span>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--gray-300)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="myfit-input pl-11"
                  placeholder="email@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="myfit-btn-primary flex h-14 w-full items-center justify-center gap-2 text-base"
            >
              {submitting && (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/50 border-t-white" />
              )}
              {submitting ? "Đang gửi..." : "Gửi email xác thực"}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full animate-[bounce_1.5s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(135deg, var(--primary-pink) 0%, var(--deep-pink) 100%)",
              boxShadow: "0 8px 24px rgba(255,107,157,0.4)",
            }}
          >
            <Mail className="h-9 w-9 text-white" />
          </div>

          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--black)" }}>
            Kiểm tra hộp thư!
          </h2>
          <p className="text-sm mb-1" style={{ color: "var(--gray-500)" }}>
            Đã gửi liên kết đến
          </p>
          <p className="mb-5 text-sm font-bold" style={{ color: "var(--primary-pink)" }}>
            {email}
          </p>

          <div
            className="mb-5 rounded-2xl px-4 py-3 text-left text-xs leading-relaxed"
            style={{
              background: "var(--pastel-pink)",
              border: "1px solid var(--blush)",
              color: "var(--gray-500)",
            }}
          >
            ✉️ Kiểm tra cả thư mục{" "}
            <span className="font-semibold" style={{ color: "var(--black)" }}>
              Spam / Junk
            </span>{" "}
            nếu không thấy email.
            <br />
            🔗 Liên kết có hiệu lực trong{" "}
            <span className="font-semibold" style={{ color: "var(--black)" }}>
              15 phút
            </span>
            .
          </div>

          {countdown > 0 && (
            <div
              className="mb-4 flex items-center justify-center gap-1.5 text-sm"
              style={{ color: "var(--gray-500)" }}
            >
              <span>Gửi lại sau</span>
              <span
                className="w-7 text-center font-bold tabular-nums"
                style={{ color: "var(--primary-pink)" }}
              >
                {countdown}
              </span>
              <span>giây</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => void requestReset(null)}
            disabled={countdown > 0 || submitting}
            className="h-11 w-full rounded-2xl border-2 text-sm font-semibold transition-all"
            style={
              countdown > 0
                ? {
                    cursor: "not-allowed",
                    borderColor: "var(--gray-100)",
                    color: "var(--gray-300)",
                  }
                : {
                    borderColor: "var(--primary-pink)",
                    color: "var(--primary-pink)",
                  }
            }
            onMouseEnter={(e) => {
              if (countdown === 0 && !submitting) {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--pastel-pink)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "";
            }}
          >
            {submitting ? "Đang gửi..." : "Gửi lại"}
          </button>

          <button
            type="button"
            onClick={() => { setSent(false); setEmail(""); }}
            className="mt-3 text-sm font-medium hover:underline"
            style={{ color: "var(--primary-pink)" }}
          >
            ← Nhập email khác
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-sm" style={{ color: "var(--gray-500)" }}>
        <Link
          href="/login"
          className="font-semibold hover:underline"
          style={{ color: "var(--primary-pink)" }}
        >
          Quay về đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
