import { Suspense } from "react";
import { ManagerStaffPanel } from "@/components/features/manager-staff-panel";

export default function ManagerStaffPage() {
  return (
    <Suspense>
      <ManagerStaffPanel />
    </Suspense>
  );
}
