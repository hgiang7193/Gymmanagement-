import { Suspense } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { MemberCheckInPanel } from "@/components/features/member-check-in-panel";

export default function MemberCheckInPage() {
  return (
    <ProtectedPage allowedRoles={["MEMBER", "ADMIN", "MANAGER"]}>
      <Suspense>
        <MemberCheckInPanel />
      </Suspense>
    </ProtectedPage>
  );
}
