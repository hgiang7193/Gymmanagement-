import { Suspense } from "react";
import { MemberReviewsPanel } from "@/components/features/member-reviews-panel";

export default function MemberReviewsPage() {
  return (
    <Suspense>
      <MemberReviewsPanel />
    </Suspense>
  );
}
