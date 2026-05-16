import { Suspense } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { MemberReviewsPanel } from "@/components/features/member-reviews-panel";

export default function MemberReviewsPage() {
  return (
    <ProtectedPage allowedRoles={["MEMBER", "ADMIN", "MANAGER"]}>
      <Suspense>
        <MemberReviewsPanel />
      </Suspense>
    </ProtectedPage>
  );
}
