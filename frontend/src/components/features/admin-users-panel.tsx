"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

type UserRow = {
  id: string;
  email: string;
  status: string;
};

type Branch = {
  id: string;
  code: string;
  name: string;
  status: string;
};

type RoleAssignment = {
  id: string;
  roleCode: string;
  roleName: string | null;
  branchId: string | null;
};

const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];
const ASSIGNABLE_ROLES = ["MEMBER", "COACH", "MANAGER", "ADMIN"];

const ERROR_MESSAGES: Record<string, string> = {
  LAST_ADMIN_PROTECTED: "Khong the vo hieu hoa Admin cuoi cung con active.",
  ROLE_ALREADY_ASSIGNED: "User da co role nay roi.",
  ROLE_NOT_ASSIGNED: "User chua co role nay de revoke.",
  BRANCH_ID_REQUIRED: "Role MANAGER can branch di kem.",
  INVALID_ROLE_CODE: "Role khong hop le.",
};

function humanError(error: unknown) {
  const code = error instanceof Error ? error.message : String(error);
  return ERROR_MESSAGES[code] ?? code;
}

export function AdminUsersPanel() {
  const queryClient = useQueryClient();
  const { authorizedRequest } = useAuth();
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ roleCode: "MEMBER", branchId: "" });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await authorizedRequest<UserRow[]>("/api/v1/admin/users")).data,
  });

  const branchesQuery = useQuery({
    queryKey: ["admin-branches-lite"],
    queryFn: async () => (await authorizedRequest<Branch[]>("/api/v1/admin/branches")).data,
  });

  const rolesQuery = useQuery({
    queryKey: ["admin-user-roles", expandedUserId],
    enabled: !!expandedUserId,
    queryFn: async () =>
      (await authorizedRequest<RoleAssignment[]>(`/api/v1/admin/users/${expandedUserId}/roles`)).data,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await authorizedRequest<UserRow>(`/api/v1/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Cap nhat user status thanh cong");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => toast.error(humanError(error)),
  });

  const assignRoleMutation = useMutation({
    mutationFn: async (payload: { userId: string; roleCode: string; branchId: string | null }) => {
      const response = await authorizedRequest<RoleAssignment>(
        `/api/v1/admin/users/${payload.userId}/roles`,
        {
          method: "POST",
          body: JSON.stringify({
            roleCode: payload.roleCode,
            branchId: payload.branchId || undefined,
          }),
        },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Da gan role");
      setAssignForm({ roleCode: "MEMBER", branchId: "" });
      void queryClient.invalidateQueries({ queryKey: ["admin-user-roles", expandedUserId] });
    },
    onError: (error) => toast.error(humanError(error)),
  });

  const revokeRoleMutation = useMutation({
    mutationFn: async (payload: { userId: string; roleCode: string; branchId: string | null }) => {
      const qs = payload.branchId ? `?branch_id=${encodeURIComponent(payload.branchId)}` : "";
      await authorizedRequest(
        `/api/v1/admin/users/${payload.userId}/roles/${payload.roleCode}${qs}`,
        { method: "DELETE" },
      );
    },
    onSuccess: () => {
      toast.success("Da go role");
      void queryClient.invalidateQueries({ queryKey: ["admin-user-roles", expandedUserId] });
    },
    onError: (error) => toast.error(humanError(error)),
  });

  return (
    <SurfaceCard title="Users" description="Quan ly tai khoan, role va trang thai. Vo hieu hoa tu dong revoke session.">
      {usersQuery.isLoading ? <p className="text-sm text-slate-600">Dang tai users...</p> : null}
      {usersQuery.isError ? <p className="text-sm text-rose-600">Khong tai duoc danh sach user.</p> : null}
      {!usersQuery.isLoading && !usersQuery.isError ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Doi status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Phan quyen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(usersQuery.data ?? []).map((user) => {
                const isExpanded = expandedUserId === user.id;
                return (
                  <>
                    <tr key={user.id}>
                      <td className="px-4 py-3 text-slate-900">{user.email}</td>
                      <td className="px-4 py-3 text-slate-700">{user.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {STATUSES.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => updateStatusMutation.mutate({ userId: user.id, status })}
                              disabled={updateStatusMutation.isPending || user.status === status}
                              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-800 transition hover:border-amber-400 hover:bg-amber-50 disabled:opacity-50"
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {isExpanded ? "Dong" : "Roles..."}
                        </button>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr key={`${user.id}-roles`}>
                        <td colSpan={4} className="bg-slate-50 px-4 py-4">
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs font-semibold uppercase text-slate-500">Roles hien tai</div>
                              {rolesQuery.isLoading ? <div className="text-xs text-slate-500">Loading...</div> : null}
                              {rolesQuery.data?.length === 0 ? <div className="text-xs text-slate-500">Chua co role nao.</div> : null}
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(rolesQuery.data ?? []).map((r) => (
                                  <span key={r.id} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-800 ring-1 ring-slate-200">
                                    {r.roleCode}
                                    {r.branchId ? <span className="text-slate-500">@ {r.branchId.slice(0, 8)}</span> : null}
                                    <button
                                      type="button"
                                      onClick={() => revokeRoleMutation.mutate({ userId: user.id, roleCode: r.roleCode, branchId: r.branchId })}
                                      disabled={revokeRoleMutation.isPending}
                                      className="text-rose-600 hover:text-rose-800"
                                      aria-label="Go role"
                                    >×</button>
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={assignForm.roleCode}
                                onChange={(e) => setAssignForm({ ...assignForm, roleCode: e.target.value })}
                                className="rounded-2xl border border-slate-300 px-3 py-2 text-xs"
                              >
                                {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                              </select>
                              {assignForm.roleCode === "MANAGER" ? (
                                <select
                                  value={assignForm.branchId}
                                  onChange={(e) => setAssignForm({ ...assignForm, branchId: e.target.value })}
                                  className="rounded-2xl border border-slate-300 px-3 py-2 text-xs"
                                >
                                  <option value="">Chon branch...</option>
                                  {(branchesQuery.data ?? []).filter((b) => b.status !== "CLOSED").map((b) => (
                                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                                  ))}
                                </select>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => assignRoleMutation.mutate({
                                  userId: user.id,
                                  roleCode: assignForm.roleCode,
                                  branchId: assignForm.roleCode === "MANAGER" ? assignForm.branchId : null,
                                })}
                                disabled={assignRoleMutation.isPending || (assignForm.roleCode === "MANAGER" && !assignForm.branchId)}
                                className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:bg-emerald-300"
                              >
                                Gan role
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </SurfaceCard>
  );
}
