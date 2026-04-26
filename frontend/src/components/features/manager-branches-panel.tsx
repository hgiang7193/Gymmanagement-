"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

type Branch = {
  id: string;
  code: string;
  name: string;
  address: string;
  phoneNumber: string | null;
  status: string;
};

export function ManagerBranchesPanel() {
  const { authorizedRequest } = useAuth();
  const branchesQuery = useQuery({
    queryKey: ["manager-branches"],
    queryFn: async () => {
      const response = await authorizedRequest<Branch[]>("/api/v1/manager/branches");
      return response.data;
    },
  });

  if (branchesQuery.isLoading) {
    return <p className="text-sm text-slate-600">Dang tai danh sach branch...</p>;
  }

  if (branchesQuery.isError) {
    return <p className="text-sm text-rose-600">Khong tai duoc branch scope cho manager.</p>;
  }

  const branches = branchesQuery.data ?? [];

  if (!branches.length) {
    return <p className="text-sm text-slate-600">Manager hien chua duoc gan branch nao.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {branches.map((branch) => (
        <SurfaceCard key={branch.id} title={branch.name} description={`Code: ${branch.code}`}>
          <dl className="space-y-2 text-sm text-slate-700">
            <div className="flex gap-2">
              <dt className="min-w-24 text-slate-500">Dia chi</dt>
              <dd>{branch.address}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-24 text-slate-500">Dien thoai</dt>
              <dd>{branch.phoneNumber || "Chua cap nhat"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-24 text-slate-500">Trang thai</dt>
              <dd className="font-medium text-slate-950">{branch.status}</dd>
            </div>
          </dl>
        </SurfaceCard>
      ))}
    </div>
  );
}
