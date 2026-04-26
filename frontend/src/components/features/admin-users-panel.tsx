"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

type UserRow = {
  id: string;
  email: string;
  status: string;
};

const statuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];

export function AdminUsersPanel() {
  const queryClient = useQueryClient();
  const { authorizedRequest } = useAuth();

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await authorizedRequest<UserRow[]>("/api/v1/admin/users");
      return response.data;
    },
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
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Cap nhat user status that bai";
      toast.error(message);
    },
  });

  return (
    <SurfaceCard title="Users" description="Danh sach user va thao tac doi status tu admin console.">
      {usersQuery.isLoading ? <p className="text-sm text-slate-600">Dang tai users...</p> : null}
      {usersQuery.isError ? <p className="text-sm text-rose-600">Khong tai duoc danh sach user.</p> : null}
      {!usersQuery.isLoading && !usersQuery.isError ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(usersQuery.data ?? []).map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-slate-900">{user.email}</td>
                  <td className="px-4 py-3 text-slate-700">{user.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {statuses.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateStatusMutation.mutate({ userId: user.id, status })}
                          disabled={updateStatusMutation.isPending}
                          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-800 transition hover:border-amber-400 hover:bg-amber-50 disabled:opacity-50"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </SurfaceCard>
  );
}
