"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

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

type UserRow = {
  id: string;
  email: string;
  status: string;
};

type CreateBranchInput = {
  code: string;
  name: string;
  address: string;
  phoneNumber: string;
};

type EditBranchInput = {
  branchId: string;
  name: string;
  address: string;
  phoneNumber: string;
  zaloLink: string;
  zaloPhone: string;
  contactEmail: string;
};

const initialForm: CreateBranchInput = {
  code: "",
  name: "",
  address: "",
  phoneNumber: "",
};

export function AdminBranchesPanel() {
  const queryClient = useQueryClient();
  const { authorizedRequest } = useAuth();
  const [form, setForm] = useState<CreateBranchInput>(initialForm);
  const [assignment, setAssignment] = useState({ branchId: "", managerUserId: "" });
  const [editing, setEditing] = useState<EditBranchInput | null>(null);

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
    () => (usersQuery.data ?? []).filter((user) => user.status === "ACTIVE"),
    [usersQuery.data],
  );

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
      toast.success("Tao chi nhanh thanh cong");
      setForm(initialForm);
      void queryClient.invalidateQueries({ queryKey: ["admin-branches"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Tao chi nhanh that bai";
      toast.error(message);
    },
  });

  const assignManagerMutation = useMutation({
    mutationFn: async (payload: { branchId: string; managerUserId: string }) => {
      const response = await authorizedRequest<{ branchId: string; managerUserId: string; activeFrom: string }>(
        `/api/v1/admin/branches/${payload.branchId}/managers`,
        {
          method: "POST",
          body: JSON.stringify({ managerUserId: payload.managerUserId }),
        },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Gan manager cho branch thanh cong");
      setAssignment({ branchId: "", managerUserId: "" });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Gan manager that bai";
      toast.error(message);
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
      toast.success("Cap nhat chi nhanh thanh cong");
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-branches"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Cap nhat that bai");
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
      toast.success("Da dong chi nhanh");
      void queryClient.invalidateQueries({ queryKey: ["admin-branches"] });
    },
    onError: (error, variables) => {
      const message = error instanceof Error ? error.message : "Dong chi nhanh that bai";
      if (message === "BRANCH_HAS_ACTIVE_MEMBERS") {
        const ok = window.confirm(
          "Chi nhanh con member dang active. Van dong (force)? Member can duoc chuyen branch sau.",
        );
        if (ok) {
          closeBranchMutation.mutate({ ...variables, force: true });
        }
        return;
      }
      toast.error(message);
    },
  });

  function onCreateBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createBranchMutation.mutate(form);
  }

  function onAssignManager(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    assignManagerMutation.mutate(assignment);
  }

  function onSubmitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <SurfaceCard title="Create branch" description="Form MVP de tao chi nhanh moi tu admin console.">
          <form className="space-y-4" onSubmit={onCreateBranch}>
            <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Code, vi du HCM-Q7" />
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Ten chi nhanh" />
            <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Dia chi" />
            <input value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="So dien thoai (optional)" />
            <button type="submit" disabled={createBranchMutation.isPending} className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:bg-slate-400">
              {createBranchMutation.isPending ? "Dang tao..." : "Tao chi nhanh"}
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Assign manager" description="Gan user vao branch voi role manager.">
          <form className="space-y-4" onSubmit={onAssignManager}>
            <select value={assignment.branchId} onChange={(event) => setAssignment((current) => ({ ...current, branchId: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option value="">Chon branch</option>
              {(branchesQuery.data ?? []).map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>
              ))}
            </select>
            <select value={assignment.managerUserId} onChange={(event) => setAssignment((current) => ({ ...current, managerUserId: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option value="">Chon user lam manager</option>
              {managerCandidates.map((user) => (
                <option key={user.id} value={user.id}>{user.email}</option>
              ))}
            </select>
            <button type="submit" disabled={assignManagerMutation.isPending || usersQuery.isLoading} className="rounded-2xl bg-amber-600 px-4 py-3 font-semibold text-white disabled:bg-amber-300">
              {assignManagerMutation.isPending ? "Dang gan..." : "Gan manager"}
            </button>
          </form>
        </SurfaceCard>

        {editing ? (
          <SurfaceCard title="Sua chi nhanh" description="Cap nhat thong tin va lien he Zalo cho khach.">
            <form className="space-y-3" onSubmit={onSubmitEdit}>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Ten chi nhanh" />
              <input value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Dia chi" />
              <input value={editing.phoneNumber} onChange={(e) => setEditing({ ...editing, phoneNumber: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="So dien thoai" />
              <input value={editing.zaloLink} onChange={(e) => setEditing({ ...editing, zaloLink: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Zalo link (https://zalo.me/...)" />
              <input value={editing.zaloPhone} onChange={(e) => setEditing({ ...editing, zaloPhone: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Zalo phone" />
              <input value={editing.contactEmail} onChange={(e) => setEditing({ ...editing, contactEmail: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Email lien he" />
              <div className="flex gap-2">
                <button type="submit" disabled={updateBranchMutation.isPending} className="rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:bg-emerald-300">
                  {updateBranchMutation.isPending ? "Dang luu..." : "Luu thay doi"}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700">Huy</button>
              </div>
            </form>
          </SurfaceCard>
        ) : null}
      </div>

      <SurfaceCard title="Branches" description="Danh sach chi nhanh hien dang lay tu backend that.">
        {branchesQuery.isLoading ? <p className="text-sm text-slate-600">Dang tai branches...</p> : null}
        {branchesQuery.isError ? <p className="text-sm text-rose-600">Khong tai duoc branches.</p> : null}
        {!branchesQuery.isLoading && !branchesQuery.isError ? (
          <div className="space-y-3">
            {(branchesQuery.data ?? []).map((branch) => {
              const isClosed = branch.status === "CLOSED";
              return (
                <div key={branch.id} className="rounded-2xl border border-slate-200 px-4 py-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-950">{branch.name}</div>
                      <div className="text-slate-500">{branch.code}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isClosed ? "bg-slate-200 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>
                      {branch.status}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div>{branch.address}</div>
                    <div className="text-slate-500">{branch.phoneNumber || "Chua co phone number"}</div>
                    {branch.zaloLink ? <div className="text-slate-500">Zalo: {branch.zaloLink}</div> : null}
                    {branch.contactEmail ? <div className="text-slate-500">Email: {branch.contactEmail}</div> : null}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => startEdit(branch)} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      Sua
                    </button>
                    {!isClosed ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Dong chi nhanh "${branch.name}"?`)) {
                            closeBranchMutation.mutate({ branchId: branch.id, force: false });
                          }
                        }}
                        disabled={closeBranchMutation.isPending}
                        className="rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Dong chi nhanh
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </SurfaceCard>
    </div>
  );
}
