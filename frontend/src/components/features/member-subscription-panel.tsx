"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

type Subscription = {
  id: string;
  membershipPlanId: string;
  homeBranchId: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  totalSessions: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  activatedAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function MemberSubscriptionPanel() {
  const { authorizedRequest } = useAuth();
  const subscriptionQuery = useQuery({
    queryKey: ["member-subscription"],
    queryFn: async () => {
      const response = await authorizedRequest<Subscription | null>("/api/v1/me/subscription");
      return response.data;
    },
  });

  if (subscriptionQuery.isLoading) {
    return <p className="text-sm text-slate-600">Dang tai subscription hien tai...</p>;
  }

  if (subscriptionQuery.isError) {
    return <p className="text-sm text-rose-600">Khong tai duoc subscription hien tai.</p>;
  }

  const subscription = subscriptionQuery.data;

  if (!subscription) {
    return <p className="text-sm text-slate-600">Ban chua co subscription nao trong he thong.</p>;
  }

  return (
    <SurfaceCard title={`Subscription ${subscription.status}`} description={`Subscription ID: ${subscription.id}`}>
      <dl className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
        <div>
          <dt className="text-slate-500">Membership plan</dt>
          <dd className="font-medium text-slate-950">{subscription.membershipPlanId}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Home branch</dt>
          <dd className="font-medium text-slate-950">{subscription.homeBranchId}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Started at</dt>
          <dd>{formatDate(subscription.startedAt)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Expires at</dt>
          <dd>{formatDate(subscription.expiresAt)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Sessions used</dt>
          <dd>{subscription.sessionsUsed}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Sessions remaining</dt>
          <dd>{subscription.sessionsRemaining}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Total sessions</dt>
          <dd>{subscription.totalSessions}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Activated at</dt>
          <dd>{formatDate(subscription.activatedAt)}</dd>
        </div>
      </dl>
    </SurfaceCard>
  );
}
