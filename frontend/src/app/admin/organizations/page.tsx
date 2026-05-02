import { Suspense } from "react";
import { AdminOrganizationsPanel } from "@/components/features/admin-organizations-panel";

export default function AdminOrganizationsPage() {
  return (
    <Suspense>
      <AdminOrganizationsPanel />
    </Suspense>
  );
}
