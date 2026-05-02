"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { SurfaceCard } from "@/components/ui/surface-card";

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

type Branch = { id: string; code: string; name: string; address: string };

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

export function PublicPackagesCatalog() {
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const plansQuery = useQuery({
    queryKey: ["public-membership-plans"],
    queryFn: async () => (await apiRequest<MembershipPlan[]>("/api/v1/membership-plans")).data,
  });

  const branchesQuery = useQuery({
    queryKey: ["public-branches"],
    queryFn: async () => (await apiRequest<Branch[]>("/api/v1/branches")).data,
  });

  const plans = (plansQuery.data ?? []).filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  if (plansQuery.isLoading) return <p className="text-sm text-slate-600">Đang tải gói tập...</p>;
  if (plansQuery.isError) return <p className="text-sm text-rose-600">Không tải được danh sách gói tập.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm gói theo tên hoặc mã..."
          className="flex-1 rounded-2xl border border-slate-300 px-4 py-3"
        />
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="rounded-2xl border border-slate-300 px-4 py-3"
        >
          <option value="">Tất cả chi nhánh</option>
          {(branchesQuery.data ?? []).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {plans.length === 0 ? (
        <SurfaceCard title="Chưa có gói nào" description="Liên hệ tư vấn viên để được hỗ trợ.">
          <Link href="/trials/book" className="inline-block rounded-2xl bg-amber-600 px-5 py-3 font-semibold text-white">
            Đặt lịch tập thử để tham khảo
          </Link>
        </SurfaceCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <SurfaceCard key={plan.id} title={plan.name} description={`Mã gói: ${plan.code}`}>
              <div className="space-y-3 text-sm text-slate-700">
                {plan.description ? <p className="text-slate-600">{plan.description}</p> : null}
                <div className="flex items-center justify-between">
                  <span>Giá</span>
                  <strong className="text-2xl text-slate-950">{formatCurrency(plan.price)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Thời hạn</span>
                  <strong className="text-slate-950">{plan.durationDays} ngày</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Số buổi</span>
                  <strong className="text-slate-950">{plan.totalSessions}</strong>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    href="/trials/book"
                    className="inline-flex rounded-full bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700"
                  >
                    Đặt tập thử
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Đăng nhập để mua
                  </Link>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}

      <SurfaceCard title="Liên hệ tư vấn" description="Bạn cần tư vấn thêm? Liên hệ Zalo của chi nhánh gần bạn.">
        <div className="grid gap-3 md:grid-cols-2">
          {(branchesQuery.data ?? []).slice(0, 4).map((b) => (
            <a
              key={b.id}
              href={`/api/v1/branches/${b.id}/contact?redirect=1`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-amber-400"
            >
              <div className="font-semibold text-slate-900">{b.name}</div>
              <div className="text-xs text-slate-500">{b.address}</div>
              <div className="mt-1 text-xs font-semibold text-amber-700">Bấm để liên hệ Zalo →</div>
            </a>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
