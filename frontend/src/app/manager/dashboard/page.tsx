import { Suspense } from "react";
import { ManagerDashboardPanel } from "@/components/features/manager-dashboard-panel";

export default function ManagerDashboardPage() {
  return (
    <Suspense>
      <ManagerDashboardPanel />
    </Suspense>
  );
}
