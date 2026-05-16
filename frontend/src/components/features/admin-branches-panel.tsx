"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";

/* ─── Types ─── */
type Branch = {
  id: string;
  code: string;
  name: string;
  address: string;
  phoneNumber: string | null;
  status: string;
  zaloLink?: string | null;
  zaloPhone?: string | null;
  contactEmail?: string | null;
};

type UserRow = { id: string; email: string; status: string };

type CreateBranchInput = { code: string; name: string; address: string; phoneNumber: string };

type EditBranchInput = {
  branchId: string;
  name: string;
  address: string;
  phoneNumber: string;
  zaloLink: string;
  zaloPhone: string;
  contactEmail: string;
};

const initialForm: CreateBranchInput = { code: "", name: "", address: "", phoneNumber: "" };

const GRADIENTS = [
  "linear-gradient(135deg,#FF6B9D,#E91E63)",
  "linear-gradient(135deg,#a78bfa,#7c3aed)",
  "linear-gradient(135deg,#34d399,#059669)",
  "linear-gradient(135deg,#fbbf24,#f59e0b)",
  "linear-gradient(135deg,#60a5fa,#3b82f6)",
  "linear-gradient(135deg,#f472b6,#ec4899)",
];

/* ─── Helpers ─── */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--black)]">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--gray-500)] hover:bg-[var(--pastel-pink)] hover:text-[var(--deep-pink)]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[var(--gray-100)] bg-[var(--off-white)] px-4 py-3 text-sm text-[var(--black)] placeholder-[var(--gray-300)] outline-none focus:border-[var(--primary-pink)] focus:ring-2 focus:ring-[#FF6B9D]/20"
    />
  );
}

function StatCard({
  label,
  value,
  sub,
  accentBg,
  accentText,
  icon,
}: {
  label: string;
  value: number;
  sub: string;
  accentBg: string;
  accentText: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="cursor-default rounded-2xl border border-transparent bg-white p-5 shadow-[0_4px_20px_rgba(255,107,157,0.06)] hover:-translate-y-0.5 hover:border-[var(--soft-pink)] hover:shadow-[0_8px_32px_rgba(255,107,157,0.18)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--gray-500)]">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentBg}`}>
          <div className={accentText}>{icon}</div>
        </div>
      </div>
      <p className="text-3xl font-bold text-[var(--black)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--gray-500)]">{sub}</p>
    </div>
  );
}

/* ─── Panel ─── */
export function AdminBranchesPanel() {
  const queryClient = useQueryClient();
  const { authorizedRequest } = useAuth();

  const [form, setForm] = useState<CreateBranchInput>(initialForm);
  const [editing, setEditing] = useState<EditBranchInput | null>(null);
  const [assignment, setAssignment] = useState({ managerUserId: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  /* ── queries ── */
  const branchesQuery = useQuery({
    queryKey: ["admin-branches"],
    queryFn: async () => {
      const response = await authorizedRequest<Branch[]>("/api/v1/admin/branches");
      return response.data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users-lite"],
    queryFn: async () => {
      const response = await authorizedRequest<UserRow[]>("/api/v1/admin/users");
      return response.data;
    },
  });

  const managerCandidates = useMemo(
    () => (usersQuery.data ?? []).filter((u) => u.status === "ACTIVE"),
    [usersQuery.data],
  );

  /* ── derived stats ── */
  const branches = branchesQuery.data ?? [];
  const totalBranches = branches.length;
  const activeBranches = branches.filter((b) => b.status !== "CLOSED").length;
  const closedBranches = branches.filter((b) => b.status === "CLOSED").length;

  const filteredBranches = useMemo(
    () =>
      branches.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.code.toLowerCase().includes(search.toLowerCase()) ||
          b.address.toLowerCase().includes(search.toLowerCase()),
      ),
    [branches, search],
  );

  /* ── mutations ── */
  const createBranchMutation = useMutation({
    mutationFn: async (payload: CreateBranchInput) => {
      const response = await authorizedRequest<Branch>("/api/v1/admin/branches", {
        method: "POST",
        body: JSON.stringify({
          code: payload.code,
          name: payload.name,
          address: payload.address,
          phoneNumber: payload.phoneNumber || null,
        }),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Tạo chi nhánh thành công");
      setForm(initialForm);
      setShowCreate(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-branches"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Tạo chi nhánh thất bại");
    },
  });

  const assignManagerMutation = useMutation({
    mutationFn: async (payload: { branchId: string; managerUserId: string }) => {
      const response = await authorizedRequest<{ branchId: string; managerUserId: string; activeFrom: string }>(
        `/api/v1/admin/branches/${payload.branchId}/managers`,
        { method: "POST", body: JSON.stringify({ managerUserId: payload.managerUserId }) },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Gán manager thành công");
      setAssignment({ managerUserId: "" });
      setAssignTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gán manager thất bại");
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: async (payload: EditBranchInput) => {
      const { branchId, ...rest } = payload;
      const body: Record<string, string | null> = {
        name: rest.name,
        address: rest.address,
        phoneNumber: rest.phoneNumber || null,
        zaloLink: rest.zaloLink || null,
        zaloPhone: rest.zaloPhone || null,
        contactEmail: rest.contactEmail || null,
      };
      const response = await authorizedRequest<Branch>(`/api/v1/admin/branches/${branchId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Cập nhật chi nhánh thành công");
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-branches"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Cập nhật thất bại");
    },
  });

  const closeBranchMutation = useMutation({
    mutationFn: async (payload: { branchId: string; force: boolean; reason?: string }) => {
      const response = await authorizedRequest<{ branchId: string; status: string }>(
        `/api/v1/admin/branches/${payload.branchId}/close`,
        { method: "POST", body: JSON.stringify({ force: payload.force, reason: payload.reason }) },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Đã đóng chi nhánh");
      void queryClient.invalidateQueries({ queryKey: ["admin-branches"] });
    },
    onError: (error, variables) => {
      const message = error instanceof Error ? error.message : "Đóng chi nhánh thất bại";
      if (message === "BRANCH_HAS_ACTIVE_MEMBERS") {
          toast.warning("Chi nhánh còn hội viên đang hoạt động", {
          description: "Hội viên cần được chuyển chi nhánh sau khi đóng.",
          action: { label: "Vẫn đóng", onClick: () => closeBranchMutation.mutate({ ...variables, force: true }) },
          cancel: { label: "Huỷ", onClick: () => {} },
        });
        return;
      }
      toast.error(message);
    },
  });

  /* ── handlers ── */
  function onCreateBranch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createBranchMutation.mutate(form);
  }

  function onAssignManager(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!assignTarget) return;
    assignManagerMutation.mutate({ branchId: assignTarget, managerUserId: assignment.managerUserId });
  }

  function onSubmitEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editing) updateBranchMutation.mutate(editing);
  }

  function startEdit(branch: Branch) {
    setEditing({
      branchId: branch.id,
      name: branch.name,
      address: branch.address,
      phoneNumber: branch.phoneNumber ?? "",
      zaloLink: branch.zaloLink ?? "",
      zaloPhone: branch.zaloPhone ?? "",
      contactEmail: branch.contactEmail ?? "",
    });
  }

  /* ── icons ── */
  const IconBuilding = (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M9 21V7l6-4v18M9 10h6M9 14h6M9 18h6" />
    </svg>
  );
  const IconCheck = (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  const IconUsers = (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M15 7a3 3 0 11-6 0 3 3 0 016 0zM21 20a4 4 0 00-4-4H7a4 4 0 00-4 4" />
    </svg>
  );
  const IconPause = (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  /* ─────────────────────────── render ─────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h2 className="text-3xl font-bold text-[var(--black)]">Chi nhánh</h2>
            <span className="rounded-full border border-[var(--soft-pink)] bg-[var(--pastel-pink)] px-3 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary-pink)]">
              ADMIN
            </span>
          </div>
          <p className="text-sm text-[var(--gray-500)]">Quản lý toàn bộ chi nhánh trong hệ thống MYFIT.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="myfit-btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tạo chi nhánh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        <StatCard label="Tổng chi nhánh" value={totalBranches} sub="Chi nhánh trong hệ thống"
          accentBg="bg-[var(--pastel-pink)]" accentText="text-[var(--primary-pink)]" icon={IconBuilding} />
        <StatCard label="Đang hoạt động" value={activeBranches}
          sub={totalBranches ? `${Math.round((activeBranches / totalBranches) * 100)}% tổng số` : "Chưa có chi nhánh"}
          accentBg="bg-[var(--mint)]" accentText="text-[#059669]" icon={IconCheck} />
        <StatCard label="Tổng Manager" value={managerCandidates.length} sub="Người dùng khả dụng"
          accentBg="bg-[#F5F3FF]" accentText="text-violet-500" icon={IconUsers} />
        <StatCard label="Tạm đóng" value={closedBranches}
          sub={closedBranches > 0 ? "Cần xem xét" : "Không có"}
          accentBg="bg-[var(--pastel-pink)]" accentText="text-[var(--rose-error)]" icon={IconPause} />
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_4px_20px_rgba(255,107,157,0.06)]">

        {/* Card header */}
        <div className="flex items-center justify-between border-b border-[var(--gray-100)] px-7 py-5">
          <div>
            <h3 className="text-lg font-bold text-[var(--black)]">Danh sách chi nhánh</h3>
            <p className="mt-0.5 text-xs text-[var(--gray-500)]">
              {filteredBranches.length} chi nhánh · cập nhật vừa xong
            </p>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-500)]"
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm chi nhánh…"
              className="w-48 rounded-xl border border-[var(--gray-100)] bg-[var(--off-white)] py-2 pl-9 pr-4 text-sm text-[var(--black)] placeholder-[var(--gray-500)] outline-none focus:border-[var(--soft-pink)] focus:ring-2 focus:ring-[#FF6B9D]/20"
            />
          </div>
        </div>

        {/* Loading / error states */}
        {branchesQuery.isLoading && (
          <div className="px-7 py-12 text-center text-sm text-[var(--gray-500)]">
            Đang tải danh sách chi nhánh…
          </div>
        )}
        {branchesQuery.isError && (
          <div className="px-7 py-12 text-center text-sm text-[var(--rose-error)]">
            Không tải được danh sách chi nhánh.
          </div>
        )}

        {/* Table */}
        {!branchesQuery.isLoading && !branchesQuery.isError && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--off-white)]">
                  <th className="px-7 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)]">Chi nhánh</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)]">Địa chỉ</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)]">Điện thoại</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)]">Trạng thái</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gray-100)]">
                {filteredBranches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-7 py-12 text-center text-sm text-[var(--gray-500)]">
                      Không tìm thấy chi nhánh nào.
                    </td>
                  </tr>
                )}
                {filteredBranches.map((branch, i) => {
                  const isClosed = branch.status === "CLOSED";
                  return (
                    <tr key={branch.id} className="hover:bg-[#FFF0F3]">
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm"
                            style={{ background: GRADIENTS[i % GRADIENTS.length] }}
                          >
                            {branch.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--black)]">{branch.name}</p>
                            <p className="mt-0.5 font-mono text-xs text-[var(--gray-500)]">{branch.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-4 text-sm text-[var(--gray-500)]">
                        {branch.address}
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--gray-500)]">
                        {branch.phoneNumber ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          isClosed
                            ? "bg-[var(--pastel-pink)] text-[var(--rose-error)]"
                            : "bg-[var(--mint)] text-[#059669]"
                        }`}>
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                            isClosed ? "bg-[var(--rose-error)]" : "bg-[#059669]"
                          }`} />
                          {isClosed ? "Tạm đóng" : "Đang hoạt động"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => startEdit(branch)}
                            title="Chỉnh sửa"
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--gray-500)] hover:bg-[var(--pastel-pink)] hover:text-[var(--deep-pink)]"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {/* Assign manager */}
                          <button
                            onClick={() => { setAssignTarget(branch.id); setAssignment({ managerUserId: "" }); }}
                            title="Gán manager"
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--gray-500)] hover:bg-[var(--pastel-pink)] hover:text-[var(--deep-pink)]"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-7 3a4 4 0 110-8 4 4 0 010 8zm-6 8a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                          </button>
                          {/* Close branch */}
                          {!isClosed && (
                            <button
                              onClick={() => {
                                toast("Đóng chi nhánh?", {
                                  description: `"${branch.name}" sẽ không nhận hội viên mới.`,
                                  action: { label: "Đóng", onClick: () => closeBranchMutation.mutate({ branchId: branch.id, force: false }) },
                                  cancel: { label: "Huỷ", onClick: () => {} },
                                });
                              }}
                              disabled={closeBranchMutation.isPending}
                              title="Đóng chi nhánh"
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--gray-500)] hover:bg-[var(--pastel-pink)] hover:text-[var(--rose-error)] disabled:opacity-40"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Card footer */}
        <div className="border-t border-[var(--gray-100)] px-7 py-4">
          <p className="text-xs text-[var(--gray-500)]">
            Hiển thị {filteredBranches.length} trong {totalBranches} chi nhánh
          </p>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Create */}
      {showCreate && (
        <Modal
          title="Tạo chi nhánh mới"
          onClose={() => { setShowCreate(false); setForm(initialForm); }}
        >
          <form className="space-y-4" onSubmit={onCreateBranch}>
            <FieldInput value={form.code} onChange={(v) => setForm((c) => ({ ...c, code: v }))} placeholder="Mã chi nhánh (vd: HCM-Q1)" />
            <FieldInput value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="Tên chi nhánh" />
            <FieldInput value={form.address} onChange={(v) => setForm((c) => ({ ...c, address: v }))} placeholder="Địa chỉ" />
            <FieldInput value={form.phoneNumber} onChange={(v) => setForm((c) => ({ ...c, phoneNumber: v }))} placeholder="Số điện thoại (tuỳ chọn)" />
            <button
              type="submit"
              disabled={createBranchMutation.isPending}
              className="myfit-btn-primary w-full rounded-xl py-3 font-semibold text-white disabled:opacity-60"
            >
              {createBranchMutation.isPending ? "Đang tạo…" : "Tạo chi nhánh"}
            </button>
          </form>
        </Modal>
      )}

      {/* Edit */}
      {editing && (
        <Modal title="Chỉnh sửa chi nhánh" onClose={() => setEditing(null)}>
          <form className="space-y-3" onSubmit={onSubmitEdit}>
            <FieldInput value={editing.name} onChange={(v) => setEditing((e) => e ? { ...e, name: v } : e)} placeholder="Tên chi nhánh" />
            <FieldInput value={editing.address} onChange={(v) => setEditing((e) => e ? { ...e, address: v } : e)} placeholder="Địa chỉ" />
            <FieldInput value={editing.phoneNumber} onChange={(v) => setEditing((e) => e ? { ...e, phoneNumber: v } : e)} placeholder="Số điện thoại" />
            <FieldInput value={editing.zaloLink} onChange={(v) => setEditing((e) => e ? { ...e, zaloLink: v } : e)} placeholder="Zalo link (https://zalo.me/…)" />
            <FieldInput value={editing.zaloPhone} onChange={(v) => setEditing((e) => e ? { ...e, zaloPhone: v } : e)} placeholder="Zalo phone" />
            <FieldInput value={editing.contactEmail} onChange={(v) => setEditing((e) => e ? { ...e, contactEmail: v } : e)} placeholder="Email liên hệ" type="email" />
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={updateBranchMutation.isPending}
                className="myfit-btn-primary flex-1 rounded-xl py-3 font-semibold text-white disabled:opacity-60"
              >
                {updateBranchMutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-[var(--gray-100)] px-5 py-3 text-sm font-semibold text-[var(--gray-500)] hover:border-[var(--soft-pink)] hover:text-[var(--primary-pink)]"
              >
                Huỷ
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign manager */}
      {assignTarget !== null && (
        <Modal
          title="Gán manager cho chi nhánh"
          onClose={() => { setAssignTarget(null); setAssignment({ managerUserId: "" }); }}
        >
          <form className="space-y-4" onSubmit={onAssignManager}>
            <p className="text-sm text-[var(--gray-500)]">
              Chi nhánh:{" "}
              <span className="font-semibold text-[var(--black)]">
                {branches.find((b) => b.id === assignTarget)?.name}
              </span>
            </p>
            <select
              value={assignment.managerUserId}
              onChange={(e) => setAssignment({ managerUserId: e.target.value })}
              className="w-full rounded-xl border border-[var(--gray-100)] bg-[var(--off-white)] px-4 py-3 text-sm text-[var(--black)] outline-none focus:border-[var(--primary-pink)] focus:ring-2 focus:ring-[#FF6B9D]/20"
            >
              <option value="">Chọn người dùng làm manager</option>
              {managerCandidates.map((u) => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
            {usersQuery.isLoading && (
              <p className="text-xs text-[var(--gray-500)]">Đang tải danh sách người dùng…</p>
            )}
            <button
              type="submit"
              disabled={assignManagerMutation.isPending || !assignment.managerUserId || usersQuery.isLoading}
              className="myfit-btn-primary w-full rounded-xl py-3 font-semibold text-white disabled:opacity-60"
            >
              {assignManagerMutation.isPending ? "Đang gán…" : "Gán manager"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
