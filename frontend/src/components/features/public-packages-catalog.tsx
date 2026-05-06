"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Check, Dumbbell, Heart, MapPin, Search, X } from "lucide-react";
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

const categoryTabs: { key: PackageCategory; label: string }[] = [
  { key: "all", label: "Tất cả gói" },
  { key: "monthly", label: "Gói tháng" },
  { key: "session", label: "Gói buổi" },
  { key: "promo", label: "Khuyến mãi" },
];

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

  if (plansQuery.isLoading) {
    return <p className="text-sm text-[var(--gray-500)]">Đang tải danh sách gói...</p>;
  }
  if (plansQuery.isError) {
    return <p className="text-sm text-[var(--rose-error)]">Không thể tải gói dịch vụ lúc này.</p>;
  }

  return (
    <section className="space-y-6">
      <div className="myfit-sticky-filter sticky top-0 z-50 rounded-2xl px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {categoryTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key)}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  selectedCategory === tab.key
                    ? "border-[var(--primary-pink)] bg-[var(--primary-pink)] text-white"
                    : "border-[var(--gray-300)] bg-white text-[var(--gray-500)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex h-10 items-center gap-2 rounded-lg border border-[var(--gray-300)] bg-white px-3 text-sm text-[var(--gray-500)]">
              <MapPin className="h-4 w-4" />
              <select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)} className="bg-transparent outline-none">
                <option value="">Tất cả chi nhánh</option>
                {(branchesQuery.data ?? []).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as "popular" | "priceAsc")}
              className="h-10 rounded-lg border border-[var(--gray-300)] bg-white px-3 text-sm text-[var(--gray-500)] outline-none"
            >
              <option value="popular">Phổ biến</option>
              <option value="priceAsc">Giá thấp → cao</option>
            </select>
          </div>
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <div className="myfit-surface rounded-[20px] p-10 text-center">
          <Search className="mx-auto h-14 w-14 text-[var(--gray-300)]" />
          <h3 className="mt-3 text-lg font-semibold text-[var(--gray-500)]">Chưa có gói phù hợp</h3>
          <p className="mt-1 text-sm text-[var(--gray-500)]">Liên hệ tư vấn viên để được hỗ trợ.</p>
          <a
            href={branchFilter ? `/api/v1/branches/${branchFilter}/contact?redirect=1` : "/packages"}
            className="myfit-btn-primary mt-5 inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm"
          >
            Chat Zalo
          </a>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredPlans.map((plan) => {
            const isFeatured = plan.id === featuredId;
            const category = resolveCategory(plan);
            const icon = category === "monthly" ? Calendar : category === "session" ? Dumbbell : Heart;
            const Icon = icon;

            return (
              <article
                key={plan.id}
                className="group overflow-hidden rounded-[20px] border border-[var(--gray-100)] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:border-[var(--soft-pink)] hover:shadow-[0_12px_32px_rgba(255,107,157,0.15)]"
              >
                <div className={`relative px-5 pb-5 pt-4 ${isFeatured ? "bg-gradient-to-br from-[var(--primary-pink)] to-[var(--deep-pink)] text-white" : "bg-gradient-to-br from-[var(--pastel-pink)] to-white"}`}>
                  {isFeatured ? (
                    <span className="absolute right-0 top-0 rounded-bl-xl rounded-tr-[20px] bg-white px-3 py-1 text-[10px] font-bold text-[var(--deep-pink)]">PHỔ BIẾN NHẤT</span>
                  ) : null}
                  <Icon className={`h-10 w-10 ${isFeatured ? "text-white" : "text-[var(--primary-pink)]"}`} />
                  <h3 className={`mt-4 text-xl font-bold ${isFeatured ? "text-white" : "text-[var(--black)]"}`}>{plan.name}</h3>
                  <p className={`mt-1 min-h-10 text-sm ${isFeatured ? "text-white/80" : "text-[var(--gray-500)]"}`}>{plan.description || "Gói tập linh hoạt theo mục tiêu của bạn."}</p>
                </div>

                <div className="space-y-4 p-5">
                  <div className="space-y-1">
                    <p className="text-sm text-[var(--gray-500)]">Giá hiện tại</p>
                    <p className="myfit-number text-3xl font-bold text-[var(--deep-pink)]">
                      {formatCurrency(plan.price)}
                      <span className="ml-1 text-sm font-medium text-[var(--gray-500)]">{category === "monthly" ? "/tháng" : "/gói"}</span>
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm text-[var(--charcoal)]">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[var(--primary-pink)]" />
                      {plan.totalSessions} buổi tập
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[var(--primary-pink)]" />
                      Thời hạn {plan.durationDays} ngày
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[var(--primary-pink)]" />
                      Hỗ trợ huấn luyện viên tại chi nhánh
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className="h-12 w-full rounded-xl border-2 border-[var(--primary-pink)] text-sm font-semibold text-[var(--primary-pink)] hover:bg-[var(--primary-pink)] hover:text-white"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedPlan ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(26,26,46,0.7)] px-4 py-8 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-[680px] overflow-y-auto rounded-3xl bg-white">
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gray-100)] text-[var(--gray-500)] hover:bg-[var(--rose-error)]/15 hover:text-[var(--rose-error)]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="bg-gradient-to-br from-[var(--pastel-pink)] to-white px-8 py-8">
              <Dumbbell className="h-14 w-14 text-[var(--primary-pink)]" />
              <h3 className="mt-4 text-3xl font-bold text-[var(--black)]">{selectedPlan.name}</h3>
              <span className="mt-3 inline-flex rounded-full bg-[var(--lavender)] px-3 py-1 text-xs font-semibold text-[#7c3aed]">
                {resolveCategory(selectedPlan) === "monthly" ? "GÓI THÁNG" : resolveCategory(selectedPlan) === "session" ? "GÓI BUỔI" : "KHUYẾN MÃI"}
              </span>
            </div>

            <div className="space-y-6 px-8 py-8">
              <section>
                <h4 className="mb-3 text-base font-semibold text-[var(--black)]">Quyền lợi</h4>
                <div className="space-y-2 border-l-4 border-[var(--primary-pink)] pl-4 text-sm text-[var(--charcoal)]">
                  <p>• {selectedPlan.totalSessions} buổi tập trong {selectedPlan.durationDays} ngày</p>
                  <p>• Miễn phí tư vấn lộ trình luyện tập</p>
                  <p>• Hỗ trợ check-in và theo dõi tiến trình</p>
                </div>
              </section>

              <section className="rounded-xl border border-[var(--gray-100)]">
                <button
                  type="button"
                  onClick={() => setShowTerms((value) => !value)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[var(--black)]"
                >
                  Điều khoản
                  <span>{showTerms ? "−" : "+"}</span>
                </button>
                {showTerms ? (
                  <div className="border-t border-[var(--gray-100)] px-4 py-3 text-sm text-[var(--gray-500)]">
                    Gói chỉ áp dụng cho các chi nhánh đang hoạt động. Không hoàn tiền phần chưa sử dụng trừ khi có chính sách đặc biệt từ chi nhánh.
                  </div>
                ) : null}
              </section>

              <section className="rounded-xl border border-[var(--gray-100)]">
                <button
                  type="button"
                  onClick={() => setShowFaq((value) => !value)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[var(--black)]"
                >
                  FAQ
                  <span>{showFaq ? "−" : "+"}</span>
                </button>
                {showFaq ? (
                  <div className="space-y-2 border-t border-[var(--gray-100)] px-4 py-3 text-sm text-[var(--gray-500)]">
                    <p><strong>Q:</strong> Có thể đổi lịch không? <strong>A:</strong> Có, tùy slot còn trống.</p>
                    <p><strong>Q:</strong> Có hỗ trợ trial trước khi mua không? <strong>A:</strong> Có, đặt lịch miễn phí.</p>
                    <p><strong>Q:</strong> Có thể dùng nhiều chi nhánh? <strong>A:</strong> Tùy theo gói và chi nhánh áp dụng.</p>
                  </div>
                ) : null}
              </section>
            </div>

            <div className="sticky bottom-0 flex flex-col gap-3 border-t border-[var(--gray-100)] bg-white px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="myfit-number text-3xl font-bold text-[var(--deep-pink)]">{formatCurrency(selectedPlan.price)}</p>
              <div className="flex gap-2">
                <a
                  href={branchFilter ? `/api/v1/branches/${branchFilter}/contact?redirect=1` : "/packages"}
                  className="flex h-11 items-center justify-center rounded-xl border border-[#25D366] px-4 text-sm font-semibold text-[#25D366]"
                >
                  Liên hệ Zalo
                </a>
                <Link href={session ? "/trials/book" : "/register"} className="myfit-btn-primary flex h-11 items-center justify-center rounded-xl px-4 text-sm">
                  {session ? "Đặt trial ngay" : "Đăng ký để đặt trial"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
