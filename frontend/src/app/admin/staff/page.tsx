import { Suspense } from "react";
import { AdminStaffPanel } from "@/components/features/admin-staff-panel";

export default function AdminStaffPage() {
  return (
    <Suspense>
      <AdminStaffPanel />
    </Suspense>
  );
}
