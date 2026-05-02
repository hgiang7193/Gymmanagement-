"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Organization = {
  id: string;
  name: string;
  taxCode: string | null;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

function OrgList() {
  const { authorizedRequest } = useAuth();
  const query = useQuery({
    queryKey: ["admin-organizations"],
    queryFn: async () => {
      const res = await authorizedRequest<Organization[]>("/api/v1/admin/organizations");
      return res.data ?? [];
    },
  });

  if (query.isLoading) return <p className="text-sm text-slate-500">Đang tải...</p>;
  if (query.isError)   return <p className="text-sm text-rose-600">Không tải được danh sách tổ chức.</p>;
  const orgs = query.data ?? [];

  return orgs.length === 0 ? (
    <p className="text-sm text-slate-500">Chưa có tổ chức nào.</p>
  ) : (
    <div className="divide-y divide-slate-100">
      {orgs.map(o => (
        <div key={o.id} className="py-3">
          <p className="font-semibold text-slate-800">{o.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {[o.taxCode, o.address, o.contactEmail, o.contactPhone].filter(Boolean).join(" · ")}
          </p>
        </div>
      ))}
    </div>
  );
}

export function AdminOrganizationsPanel() {
  const { authorizedRequest } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName]               = useState("");
  const [taxCode, setTaxCode]         = useState("");
  const [address, setAddress]         = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await authorizedRequest("/api/v1/admin/organizations", {
        method: "POST",
        body: JSON.stringify({ name, taxCode: taxCode || null, address: address || null, contactEmail: contactEmail || null, contactPhone: contactPhone || null }),
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Tổ chức đã được tạo thành công.");
      setName(""); setTaxCode(""); setAddress(""); setContactEmail(""); setContactPhone("");
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <AppShell role="ADMIN" title="Tổ chức" description="Quản lý tổ chức và doanh nghiệp liên kết.">
      <ScreenIntro eyebrow="Admin" title="Quản lý tổ chức" body="UC-ADMIN-01: Tạo và xem danh sách tổ chức trong hệ thống." />

      <SurfaceCard title="Danh sách tổ chức" description="Tất cả tổ chức đang hoạt động.">
        <OrgList />
      </SurfaceCard>

      <SurfaceCard title="Tạo tổ chức mới" description="Thêm tổ chức hoặc doanh nghiệp liên kết.">
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Tên tổ chức *</span>
              <input required value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Mã số thuế</span>
              <input value={taxCode} onChange={e => setTaxCode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </label>
            <label className="block space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Địa chỉ</span>
              <input value={address} onChange={e => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Email liên hệ</span>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Số điện thoại</span>
              <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </label>
          </div>
          <button type="submit" disabled={mutation.isPending}
            className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400 transition">
            {mutation.isPending ? "Đang tạo..." : "Tạo tổ chức"}
          </button>
        </form>
      </SurfaceCard>
    </AppShell>
  );
}
