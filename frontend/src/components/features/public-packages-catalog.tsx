"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  ChevronDown,
  Dumbbell,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { useAuth } from "@/components/providers/auth-provider";

type MembershipPlan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price: number;
  durationDays: number;
  totalSessions: number;
  isActive: boolean;
};

type Branch = {
  id: string;
  code: string;
  name: string;
  address: string;
};

type PackageCategory = "all" | "monthly" | "session" | "promo";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function resolveCategory(plan: MembershipPlan): PackageCategory {
  const token = `${plan.name} ${plan.code}`.toLowerCase();
  if (token.includes("promo") || token.includes("km") || token.includes("sale")) return "promo";
  if (plan.durationDays >= 28) return "monthly";
  return "session";
}

function featuredPlanId(plans: MembershipPlan[]) {
  if (plans.length === 0) return null;
  return [...plans].sort((a, b) => a.price - b.price)[Math.floor(plans.length / 2)]?.id ?? plans[0].id;
}

const categoryTabs: { key: PackageCategory; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "Tất cả", icon: Sparkles },
  { key: "monthly", label: "Gói tháng", icon: Calendar },
  { key: "session", label: "Gói buổi", icon: Dumbbell },
  { key: "promo", label: "Khuyến mãi", icon: Zap },
];

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--blush)] bg-white shadow-sm animate-pulse">
      <div className="h-36 bg-gradient-to-br from-[var(--pastel-pink)] to-[var(--blush)]" />
      <div className="space-y-3 p-6">
        <div className="h-8 w-28 rounded-lg bg-[var(--gray-100)]" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-[var(--gray-100)]" />
          <div className="h-4 w-3/4 rounded bg-[var(--gray-100)]" />
          <div className="h-4 w-5/6 rounded bg-[var(--gray-100)]" />
        </div>
        <div className="h-11 w-full rounded-xl bg-[var(--gray-100)]" />
        <div className="h-11 w-full rounded-xl bg-[var(--gray-100)]" />
      </div>
    </div>
  );
}

export function PublicPackagesCatalog() {
  const { session } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<PackageCategory>("all");
  const [branchFilter, setBranchFilter] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "priceAsc">("popular");
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  const plansQuery = useQuery({
    queryKey: ["public-membership-plans"],
    queryFn: async () => (await apiRequest<MembershipPlan[]>("/api/v1/membership-plans")).data,
  });
  const branchesQuery = useQuery({
    queryKey: ["public-branches"],
    queryFn: async () => (await apiRequest<Branch[]>("/api/v1/branches")).data,
  });

  const plans = useMemo(() => plansQuery.data ?? [], [plansQuery.data]);
  const featuredId = useMemo(() => featuredPlanId(plans), [plans]);

  const filteredPlans = useMemo(() => {
    const activePlans = plans.filter((item) => item.isActive);
    const byCategory =
      selectedCategory === "all"
        ? activePlans
        : activePlans.filter((item) => resolveCategory(item) === selectedCategory);
    const sorted =
      sortBy === "priceAsc"
        ? [...byCategory].sort((a, b) => a.price - b.price)
        : [...byCategory].sort((a, b) => b.totalSessions - a.totalSessions);
    return sorted;
  }, [plans, selectedCategory, sortBy]);

  return (
    <section className="space-y-0">
      <div
        className="relative overflow-hidden px-4 py-20"
        style={{
          background:
            "linear-gradient(135deg, #FFF0F3 0%, #FFE4E1 40%, #E6E6FA 80%, #F0FFF4 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 10% 20%, rgba(255,107,157,0.12) 0%, transparent 40%), radial-gradient(circle at 80% 10%, rgba(230,230,250,0.18) 0%, transparent 35%), radial-gradient(circle at 50% 90%, rgba(255,107,157,0.08) 0%, transparent 30%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-[var(--deep-pink)]"
            style={{ background: "rgba(255,107,157,0.15)" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Gói tập 2026
          </span>

          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-[var(--black)] md:text-5xl lg:text-6xl">
            Chọn gói tập{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--primary-pink), var(--deep-pink))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              phù hợp nhất
            </span>{" "}
            với bạn
          </h1>

          <p className="mt-4 max-w-2xl text-base text-[var(--gray-500)] md:text-lg">
            Linh hoạt theo mục tiêu — gói tháng, gói buổi hay khuyến mãi đặc biệt, MYFIT luôn có lựa chọn dành cho bạn.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/trials/book"
              className="myfit-btn-primary inline-flex h-14 items-center gap-2 rounded-2xl px-8 text-base font-bold"
            >
              <Zap className="h-5 w-5" />
              Tập thử miễn phí
            </Link>
            <a
              href="#packages-grid"
              className="inline-flex h-14 items-center gap-2 rounded-2xl border-2 border-[var(--black)] px-8 text-base font-semibold text-[var(--black)] hover:bg-[var(--black)] hover:text-white"
            >
              Xem bảng giá
              <ChevronDown className="h-5 w-5" />
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-8">
            <div className="flex items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,107,157,0.15)" }}
              >
                <Users className="h-5 w-5 text-[var(--primary-pink)]" />
              </div>
              <div>
                <p className="myfit-number text-xl font-extrabold text-[var(--black)]">5,000+</p>
                <p className="text-xs text-[var(--gray-500)]">Hội viên</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,107,157,0.15)" }}
              >
                <MapPin className="h-5 w-5 text-[var(--primary-pink)]" />
              </div>
              <div>
                <p className="myfit-number text-xl font-extrabold text-[var(--black)]">12+</p>
                <p className="text-xs text-[var(--gray-500)]">Chi nhánh</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,107,157,0.15)" }}
              >
                <Star className="h-5 w-5 fill-[var(--primary-pink)] text-[var(--primary-pink)]" />
              </div>
              <div>
                <p className="myfit-number text-xl font-extrabold text-[var(--black)]">4.9★</p>
                <p className="text-xs text-[var(--gray-500)]">Đánh giá trung bình</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        id="packages-grid"
        className="myfit-sticky-filter sticky top-0 z-50 px-4 py-3 lg:px-6"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {categoryTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = selectedCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedCategory(tab.key)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all"
                  style={
                    isActive
                      ? {
                          background:
                            "linear-gradient(135deg, var(--primary-pink), var(--deep-pink))",
                          borderColor: "var(--primary-pink)",
                          color: "white",
                          boxShadow: "0 4px 14px rgba(255,107,157,0.35)",
                        }
                      : {
                          background: "linear-gradient(180deg, rgba(255,248,250,0.95) 0%, rgba(255,236,242,0.88) 100%)",
                          borderColor: "var(--blush)",
                          color: "var(--gray-500)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                        }
                  }
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[var(--gray-300)] bg-white px-3 text-sm text-[var(--gray-500)] hover:border-[var(--primary-pink)]">
              <MapPin className="h-4 w-4 shrink-0" />
              <select
                value={branchFilter}
                onChange={(event) => setBranchFilter(event.target.value)}
                className="bg-transparent outline-none"
              >
                <option value="">Tất cả chi nhánh</option>
                {(branchesQuery.data ?? []).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[var(--gray-300)] bg-white px-3 text-sm text-[var(--gray-500)] hover:border-[var(--primary-pink)]">
              <ChevronDown className="h-4 w-4 shrink-0" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as "popular" | "priceAsc")}
                className="bg-transparent outline-none"
              >
                <option value="popular">Phổ biến nhất</option>
                <option value="priceAsc">Giá thấp → cao</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-6">
        {plansQuery.isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : plansQuery.isError ? (
          <div className="rounded-3xl border border-[var(--rose-error)]/30 bg-[var(--rose-error)]/5 p-10 text-center">
            <p className="text-sm font-medium text-[var(--rose-error)]">
              Không thể tải gói dịch vụ lúc này. Vui lòng thử lại sau.
            </p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="myfit-surface rounded-3xl p-14 text-center">
            <div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: "rgba(255,107,157,0.1)" }}
            >
              <Search className="h-9 w-9 text-[var(--primary-pink)]" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-[var(--black)]">Chưa có gói phù hợp</h3>
            <p className="mt-2 text-sm text-[var(--gray-500)]">
              Liên hệ tư vấn viên để được hỗ trợ chọn gói tốt nhất.
            </p>
            <a
              href={branchFilter ? `/api/v1/branches/${branchFilter}/contact?redirect=1` : "/packages"}
              className="myfit-btn-primary mt-6 inline-flex h-12 items-center justify-center rounded-2xl px-8 text-sm"
            >
              Chat Zalo ngay
            </a>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlans.map((plan) => {
              const isFeatured = plan.id === featuredId;
              const category = resolveCategory(plan);
              const IconComponent =
                category === "monthly" ? Calendar : category === "session" ? Dumbbell : Heart;

              return (
                <article
                  key={plan.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--blush)] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(255,107,157,0.2)]"
                  style={isFeatured ? { borderColor: "var(--primary-pink)" } : {}}
                >
                  {isFeatured && (
                    <div
                      className="absolute right-0 top-0 z-10 rounded-bl-2xl rounded-tr-3xl px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--primary-pink), var(--deep-pink))",
                      }}
                    >
                      Phổ biến nhất
                    </div>
                  )}

                  <div
                    className="relative px-6 pb-6 pt-7"
                    style={
                      isFeatured
                        ? {
                            background:
                              "linear-gradient(135deg, var(--primary-pink) 0%, var(--deep-pink) 100%)",
                          }
                        : {
                            background:
                              "linear-gradient(135deg, var(--pastel-pink) 0%, white 100%)",
                          }
                    }
                  >
                    <div
                      className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={
                        isFeatured
                          ? { background: "rgba(255,255,255,0.25)" }
                          : { background: "rgba(255,107,157,0.12)" }
                      }
                    >
                      <IconComponent
                        className="h-6 w-6"
                        style={{ color: isFeatured ? "white" : "var(--primary-pink)" }}
                      />
                    </div>
                    <h3
                      className="text-xl font-extrabold"
                      style={{ color: isFeatured ? "white" : "var(--black)" }}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className="mt-1 min-h-10 text-sm"
                      style={{
                        color: isFeatured ? "rgba(255,255,255,0.8)" : "var(--gray-500)",
                      }}
                    >
                      {plan.description || "Gói tập linh hoạt theo mục tiêu của bạn."}
                    </p>
                  </div>

                  <div className="flex flex-1 flex-col space-y-5 p-6">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--gray-500)]">
                        Giá hiện tại
                      </p>
                      <p className="myfit-number mt-1 text-3xl font-extrabold text-[var(--deep-pink)]">
                        {formatCurrency(plan.price)}
                        <span className="ml-1.5 text-sm font-medium text-[var(--gray-500)]">
                          {category === "monthly" ? "/tháng" : "/gói"}
                        </span>
                      </p>
                    </div>

                    <ul className="space-y-2.5 text-sm text-[var(--charcoal)]">
                      <li className="flex items-center gap-2.5">
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                          style={{ background: "rgba(255,107,157,0.12)" }}
                        >
                          <Check className="h-3 w-3 text-[var(--primary-pink)]" />
                        </span>
                        {plan.totalSessions} buổi tập
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                          style={{ background: "rgba(255,107,157,0.12)" }}
                        >
                          <Check className="h-3 w-3 text-[var(--primary-pink)]" />
                        </span>
                        Thời hạn {plan.durationDays} ngày
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                          style={{ background: "rgba(255,107,157,0.12)" }}
                        >
                          <Check className="h-3 w-3 text-[var(--primary-pink)]" />
                        </span>
                        Hỗ trợ huấn luyện viên tại chi nhánh
                      </li>
                    </ul>

                    <div className="mt-auto flex flex-col gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPlan(plan)}
                        className="myfit-btn-primary flex h-11 w-full items-center justify-center rounded-2xl text-sm font-bold"
                      >
                        Mua gói
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlan(plan)}
                        className="flex h-11 w-full items-center justify-center rounded-2xl border-2 border-[var(--primary-pink)] text-sm font-semibold text-[var(--primary-pink)] hover:bg-[var(--pastel-pink)]"
                      >
                        Dùng thử
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedPlan ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center px-0 sm:px-4 py-0 sm:py-8"
          style={{ background: "rgba(26,26,46,0.72)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPlan(null);
          }}
        >
          <div
            className="relative flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white sm:max-w-[680px] sm:rounded-3xl"
            style={{ boxShadow: "0 32px 80px rgba(26,26,46,0.35)" }}
          >
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gray-100)] text-[var(--gray-500)] hover:bg-[var(--rose-error)]/15 hover:text-[var(--rose-error)]"
            >
              <X className="h-5 w-5" />
            </button>

            <div
              className="flex-shrink-0 px-8 py-8"
              style={{
                background:
                  "linear-gradient(135deg, var(--pastel-pink) 0%, white 100%)",
              }}
            >
              <div
                className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl"
                style={{ background: "rgba(255,107,157,0.12)" }}
              >
                <Dumbbell className="h-8 w-8 text-[var(--primary-pink)]" />
              </div>
              <h3 className="text-3xl font-extrabold text-[var(--black)]">
                {selectedPlan.name}
              </h3>
              <span
                className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                style={{ background: "var(--lavender)", color: "#7c3aed" }}
              >
                {resolveCategory(selectedPlan) === "monthly"
                  ? "Gói tháng"
                  : resolveCategory(selectedPlan) === "session"
                  ? "Gói buổi"
                  : "Khuyến mãi"}
              </span>
            </div>

            <div className="overflow-y-auto">
              <div className="space-y-5 px-8 py-6">
                <section>
                  <h4 className="mb-3 text-base font-bold text-[var(--black)]">Quyền lợi</h4>
                  <div
                    className="space-y-2.5 rounded-2xl border-l-4 border-[var(--primary-pink)] bg-[var(--pastel-pink)] px-5 py-4 text-sm text-[var(--charcoal)]"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[var(--primary-pink)]" />
                      <span>
                        {selectedPlan.totalSessions} buổi tập trong {selectedPlan.durationDays} ngày
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[var(--primary-pink)]" />
                      <span>Miễn phí tư vấn lộ trình luyện tập</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[var(--primary-pink)]" />
                      <span>Hỗ trợ check-in và theo dõi tiến trình</span>
                    </div>
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-[var(--gray-100)]">
                  <button
                    type="button"
                    onClick={() => setShowTerms((value) => !value)}
                    className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-bold text-[var(--black)] hover:bg-[var(--gray-100)]"
                  >
                    Điều khoản sử dụng
                    <span className="text-[var(--primary-pink)]">{showTerms ? "−" : "+"}</span>
                  </button>
                  {showTerms ? (
                    <div className="border-t border-[var(--gray-100)] bg-[var(--gray-100)]/40 px-5 py-4 text-sm leading-relaxed text-[var(--gray-500)]">
                      Gói chỉ áp dụng cho các chi nhánh đang hoạt động. Không hoàn tiền phần chưa
                      sử dụng trừ khi có chính sách đặc biệt từ chi nhánh.
                    </div>
                  ) : null}
                </section>

                <section className="overflow-hidden rounded-2xl border border-[var(--gray-100)]">
                  <button
                    type="button"
                    onClick={() => setShowFaq((value) => !value)}
                    className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-bold text-[var(--black)] hover:bg-[var(--gray-100)]"
                  >
                    Câu hỏi thường gặp
                    <span className="text-[var(--primary-pink)]">{showFaq ? "−" : "+"}</span>
                  </button>
                  {showFaq ? (
                    <div className="space-y-3 border-t border-[var(--gray-100)] bg-[var(--gray-100)]/40 px-5 py-4 text-sm leading-relaxed text-[var(--gray-500)]">
                      <p>
                        <strong className="text-[var(--black)]">Có thể đổi lịch không?</strong>
                        <br />
                        Có, tùy slot còn trống.
                      </p>
                      <p>
                        <strong className="text-[var(--black)]">
                          Có hỗ trợ trial trước khi mua không?
                        </strong>
                        <br />
                        Có, đặt lịch miễn phí.
                      </p>
                      <p>
                        <strong className="text-[var(--black)]">Có thể dùng nhiều chi nhánh?</strong>
                        <br />
                        Tùy theo gói và chi nhánh áp dụng.
                      </p>
                    </div>
                  ) : null}
                </section>
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-[var(--gray-100)] bg-white px-8 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-[var(--gray-500)]">Tổng thanh toán</p>
                  <p className="myfit-number text-3xl font-extrabold text-[var(--deep-pink)]">
                    {formatCurrency(selectedPlan.price)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={
                      branchFilter
                        ? `/api/v1/branches/${branchFilter}/contact?redirect=1`
                        : "/packages"
                    }
                    className="flex h-11 items-center justify-center rounded-2xl border-2 px-4 text-sm font-bold"
                    style={{ borderColor: "#25D366", color: "#25D366" }}
                  >
                    Liên hệ Zalo
                  </a>
                  <Link
                    href={session ? "/trials/book" : "/register"}
                    className="myfit-btn-primary flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-bold"
                  >
                    {session ? "Đặt trial ngay" : "Đăng ký để đặt trial"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
