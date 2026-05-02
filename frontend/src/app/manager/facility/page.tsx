import { Suspense } from "react";
import { ManagerFacilityPanel } from "@/components/features/manager-facility-panel";

export default function ManagerFacilityPage() {
  return (
    <Suspense>
      <ManagerFacilityPanel />
    </Suspense>
  );
}
