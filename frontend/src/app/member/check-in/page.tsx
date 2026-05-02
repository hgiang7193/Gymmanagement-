import { Suspense } from "react";
import { MemberCheckInPanel } from "@/components/features/member-check-in-panel";

export default function MemberCheckInPage() {
  return (
    <Suspense>
      <MemberCheckInPanel />
    </Suspense>
  );
}
