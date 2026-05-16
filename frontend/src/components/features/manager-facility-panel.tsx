"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AppShell, ScreenIntro } from "@/components/layout/app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Asset = {
  id: string;
  assetCode: string;
  name: string;
  assetType: string;
  status: string;
  areaName: string | null;
  notes: string | null;
};

type Ticket = {
  id: string;
  title: string;
  status: string;
  assetName: string;
  assetCode: string;
  createdAt: string;
};

type DashboardData = {
  totalAssets: number;
  assetsByStatus: Record<string, number>;
  ticketsByStatus: Record<string, number>;
  openTickets: Ticket[];
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  MAINTENANCE: "bg-amber-100 text-amber-800",
  BROKEN: "bg-rose-100 text-rose-800",
  RETIRED: "bg-slate-100 text-slate-600",
  OPEN: "bg-rose-100 text-rose-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-slate-100 text-slate-600",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

function FacilityOverview({ branchId }: { branchId: string }) {
  const { authorizedRequest } = useAuth();
  const query = useQuery({
    queryKey: ["facility-dashboard", branchId],
    queryFn: async () => {
      const res = await authorizedRequest<DashboardData>(`/api/v1/manager/facility/dashboard?branch_id=${branchId}`);
      return res.data;
    },
    refetchInterval: 60_000,
  });

  if (query.isLoading) return <p className="text-sm text-slate-500">Đang tải...</p>;
  if (query.isError) return <p className="text-sm text-rose-600">Không tải được dữ liệu.</p>;
  const d = query.data;
  if (!d) return null;

  return (
    <SurfaceCard title="Tổng quan cơ sở vật chất" description="UC-FAC-08: Thống kê thiết bị và phiếu sự cố.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
        {Object.entries(d.assetsByStatus).map(([status, cnt]) => (
          <div key={status} className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-lg font-bold text-slate-900">{cnt}</p>
            <p className="text-xs text-slate-500 mt-0.5">{status}</p>
          </div>
        ))}
      </div>
      {d.openTickets.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Phiếu sự cố đang mở ({d.openTickets.length})</p>
          <div className="divide-y divide-slate-100">
            {d.openTickets.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-400">{t.assetName} · {t.assetCode}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </SurfaceCard>
  );
}

function AssetsList({ branchId }: { branchId: string }) {
  const { authorizedRequest } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");

  const query = useQuery({
    queryKey: ["manager-assets", branchId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ branch_id: branchId });
      if (statusFilter) params.set("status", statusFilter);
      const res = await authorizedRequest<Asset[]>(`/api/v1/manager/assets?${params}`);
      return res.data ?? [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ assetId, status }: { assetId: string; status: string }) => {
      await authorizedRequest(`/api/v1/manager/assets/${assetId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      toast.success("Trạng thái thiết bị đã được cập nhật");
      queryClient.invalidateQueries({ queryKey: ["manager-assets"] });
      queryClient.invalidateQueries({ queryKey: ["facility-dashboard"] });
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const assets = query.data ?? [];

  return (
    <SurfaceCard title="Danh sách thiết bị" description="UC-FAC-02/03/04: Theo dõi và cập nhật trạng thái thiết bị.">
      <div className="flex gap-3 mb-4">
        {["", "ACTIVE", "MAINTENANCE", "BROKEN", "RETIRED"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${statusFilter === s ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {s || "Tất cả"}
          </button>
        ))}
      </div>
      {query.isLoading ? (
        <p className="text-sm text-slate-500">Đang tải...</p>
      ) : assets.length === 0 ? (
        <p className="text-sm text-slate-500">Không có thiết bị nào.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {assets.map(a => (
            <div key={a.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-800">{a.name}</p>
                <p className="text-xs text-slate-400">{a.assetCode} · {a.assetType}{a.areaName ? ` · ${a.areaName}` : ""}</p>
                {a.notes && <p className="text-xs text-slate-500 mt-0.5">{a.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={a.status} />
                {a.status !== "RETIRED" && (
                  <select
                    value={a.status}
                    onChange={e => updateMutation.mutate({ assetId: a.id, status: e.target.value })}
                    className="text-xs rounded-lg border border-slate-200 px-2 py-1 outline-none focus:border-amber-400 bg-white"
                  >
                    {["ACTIVE", "MAINTENANCE", "BROKEN", "RETIRED"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}

function AddAssetForm({ branchId, onSuccess }: { branchId: string; onSuccess: () => void }) {
  const { authorizedRequest } = useAuth();
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      await authorizedRequest("/api/v1/manager/assets", {
        method: "POST",
        body: JSON.stringify({ branchId, name, assetType, notes: notes || null }),
      });
    },
    onSuccess: () => {
      toast.success("Thiết bị đã được thêm");
      setName(""); setAssetType(""); setNotes("");
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <SurfaceCard title="Thêm thiết bị mới" description="UC-FAC-02: Đăng ký thiết bị vào hệ thống.">
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Tên thiết bị *</span>
            <input required value={name} onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: Máy chạy bộ A1"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Loại thiết bị *</span>
            <input required value={assetType} onChange={e => setAssetType(e.target.value)}
              placeholder="Ví dụ: TREADMILL, BARBELL, INBODY"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </label>
          <label className="block space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Ghi chú</span>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </label>
        </div>
        <button type="submit" disabled={mutation.isPending}
          className="rounded-2xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400 transition">
          {mutation.isPending ? "Đang lưu..." : "Thêm thiết bị"}
        </button>
      </form>
    </SurfaceCard>
  );
}

function TicketsList({ branchId }: { branchId: string }) {
  const { authorizedRequest } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["manager-tickets", branchId],
    queryFn: async () => {
      const res = await authorizedRequest<Ticket[]>(`/api/v1/manager/tickets?branch_id=${branchId}`);
      return res.data ?? [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      await authorizedRequest(`/api/v1/manager/tickets/${ticketId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      toast.success("Trạng thái phiếu đã được cập nhật");
      queryClient.invalidateQueries({ queryKey: ["manager-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["facility-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["manager-assets"] });
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const tickets = query.data ?? [];

  return (
    <SurfaceCard title="Phiếu sự cố & bảo trì" description="UC-FAC-05/06: Quản lý tiến độ xử lý sự cố.">
      {query.isLoading ? (
        <p className="text-sm text-slate-500">Đang tải...</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-slate-500">Không có phiếu sự cố nào.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {tickets.map(t => (
            <div key={t.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-800">{t.title}</p>
                <p className="text-xs text-slate-400">{t.assetName} · {t.assetCode}</p>
                <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString("vi-VN")}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={t.status} />
                {!["CLOSED"].includes(t.status) && (
                  <select
                    value={t.status}
                    onChange={e => updateMutation.mutate({ ticketId: t.id, status: e.target.value })}
                    className="text-xs rounded-lg border border-slate-200 px-2 py-1 outline-none focus:border-amber-400 bg-white"
                  >
                    {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}

function CreateTicketForm({ branchId, onSuccess }: { branchId: string; onSuccess: () => void }) {
  const { authorizedRequest } = useAuth();
  const [assetId, setAssetId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      await authorizedRequest("/api/v1/manager/tickets", {
        method: "POST",
        body: JSON.stringify({ assetId, branchId, title, description: description || null }),
      });
    },
    onSuccess: () => {
      toast.success("Phiếu sự cố đã được tạo");
      setAssetId(""); setTitle(""); setDescription("");
      onSuccess();
    },
    onError: (err: Error) => {
      const map: Record<string, string> = { ASSET_NOT_FOUND: "Không tìm thấy thiết bị", TICKET_TITLE_REQUIRED: "Vui lòng nhập tiêu đề" };
      toast.error(map[err.message] ?? err.message);
    },
  });

  return (
    <SurfaceCard title="Tạo phiếu sự cố" description="UC-FAC-05: Ghi nhận sự cố thiết bị.">
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Asset ID *</span>
            <input required value={assetId} onChange={e => setAssetId(e.target.value)}
              placeholder="ID thiết bị bị sự cố"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Tiêu đề *</span>
            <input required value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Mô tả ngắn về sự cố"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </label>
          <label className="block space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Mô tả chi tiết</span>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400 resize-none" />
          </label>
        </div>
        <button type="submit" disabled={mutation.isPending}
          className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-slate-400 transition">
          {mutation.isPending ? "Đang tạo..." : "Tạo phiếu sự cố"}
        </button>
      </form>
    </SurfaceCard>
  );
}

export function ManagerFacilityPanel() {
  const { session, authorizedRequest } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = session?.role === "ADMIN";
  const sessionBranchId = session?.branchIds?.[0] ?? "";
  const [adminBranchId, setAdminBranchId] = useState("");

  const branchesQuery = useQuery({
    queryKey: ["facility-branches"],
    queryFn: async () => (await authorizedRequest<{ id: string; name: string; code: string }[]>("/api/v1/branches")).data ?? [],
  });

  const branchId = isAdmin ? adminBranchId : sessionBranchId;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["manager-assets"] });
    queryClient.invalidateQueries({ queryKey: ["manager-tickets"] });
    queryClient.invalidateQueries({ queryKey: ["facility-dashboard"] });
  };

  return (
    <AppShell role="MANAGER" title="Cơ sở vật chất" description="Quản lý thiết bị, khu vực và phiếu bảo trì.">
      <ScreenIntro eyebrow="Manager" title="Cơ sở vật chất" body="Theo dõi trạng thái thiết bị, tạo phiếu sự cố và xử lý bảo trì." />
      {isAdmin && (
        <SurfaceCard title="Chọn chi nhánh" description="Quản trị viên chọn chi nhánh để xem cơ sở vật chất.">
          <select
            value={adminBranchId}
            onChange={(e) => setAdminBranchId(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">— Chọn chi nhánh —</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </select>
        </SurfaceCard>
      )}
      {!branchId ? (
        <SurfaceCard title="Chưa có chi nhánh">
          <p className="text-sm text-slate-600">{isAdmin ? "Hãy chọn chi nhánh ở trên để xem dữ liệu." : "Tài khoản chưa được gán chi nhánh. Liên hệ Admin để được hỗ trợ."}</p>
        </SurfaceCard>
      ) : (
        <>
          <FacilityOverview branchId={branchId} />
          <AssetsList branchId={branchId} />
          <AddAssetForm branchId={branchId} onSuccess={invalidateAll} />
          <TicketsList branchId={branchId} />
          <CreateTicketForm branchId={branchId} onSuccess={invalidateAll} />
        </>
      )}
    </AppShell>
  );
}
