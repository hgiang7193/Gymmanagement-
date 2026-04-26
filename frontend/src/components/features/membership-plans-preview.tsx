"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiRequest } from "@/lib/api/client";
import { SurfaceCard } from "@/components/ui/surface-card";

type MembershipPlan = {
  id: string;
  code: string;
  name: string;
  price: number;
  durationDays: number;
  totalSessions: number;
  isActive: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

export function MembershipPlansPreview() {
  const plansQuery = useQuery({
    queryKey: ["membership-plans"],
    queryFn: async () => {
      const response = await apiRequest<MembershipPlan[]>("/api/v1/membership-plans");
      return response.data;
    },
  });

  if (plansQuery.isLoading) {
    return <p className="text-sm text-slate-600">Dang tai danh sach goi tap...</p>;
  }

  if (plansQuery.isError) {
    return <p className="text-sm text-rose-600">Khong tai duoc membership plans. Kiem tra backend va `NEXT_PUBLIC_API_BASE_URL`.</p>;
  }

  const plans = plansQuery.data ?? [];

  if (!plans.length) {
    return <p className="text-sm text-slate-600">Chua co membership plan active.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {plans.map((plan) => (
        <SurfaceCard key={plan.id} title={plan.name} description={`Ma goi: ${plan.code}`}>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Gia</span>
              <strong className="text-slate-950">{formatCurrency(plan.price)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Thoi han</span>
              <strong className="text-slate-950">{plan.durationDays} ngay</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>So buoi</span>
              <strong className="text-slate-950">{plan.totalSessions}</strong>
            </div>
            <Link href="/login" className="inline-flex rounded-full bg-slate-950 px-4 py-2 font-medium text-white transition hover:bg-slate-800">
              Dang nhap de kich hoat
            </Link>
          </div>
        </SurfaceCard>
      ))}
    </div>
  );
}
