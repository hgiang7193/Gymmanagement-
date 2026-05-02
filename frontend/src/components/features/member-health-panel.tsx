"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { SurfaceCard } from "@/components/ui/surface-card";

type HealthProgress = {
  profile: {
    targetWeight: string | null;
    primaryGoal: string | null;
    dietaryPreferences: string[];
    medicalConditions: string[];
    notes: string | null;
  };
  weightHistory: {
    weightUnit: string;
    weightValue: string;
    loggedAt: string;
    source: string;
  }[];
  measurementHistory: {
    chest: string | null;
    waist: string | null;
    hips: string | null;
    arms: string | null;
    thighs: string | null;
    unit: string;
    measuredAt: string;
    source: string;
  }[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function MemberHealthPanel() {
  const { authorizedRequest } = useAuth();
  const progressQuery = useQuery({
    queryKey: ["member-health-progress"],
    queryFn: async () => {
      const response = await authorizedRequest<HealthProgress>("/api/v1/health/progress");
      return response.data;
    },
  });

  if (progressQuery.isLoading) {
    return <p className="text-sm text-slate-600">Dang tai du lieu suc khoe...</p>;
  }

  if (progressQuery.isError) {
    return <p className="text-sm text-rose-600">Khong tai duoc du lieu suc khoe.</p>;
  }

  const progress = progressQuery.data;

  if (!progress) {
    return <p className="text-sm text-slate-600">Chua co ho so suc khoe.</p>;
  }

  return (
    <div className="space-y-6 mt-6">
      <SurfaceCard title="Health Profile" description="Muc tieu va luu y y te">
        <dl className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <div>
            <dt className="text-slate-500">Target Weight</dt>
            <dd className="font-medium text-slate-950">{progress.profile.targetWeight || "N/A"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Primary Goal</dt>
            <dd className="font-medium text-slate-950">{progress.profile.primaryGoal || "N/A"}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-slate-500">Dietary Preferences</dt>
            <dd>{progress.profile.dietaryPreferences?.length > 0 ? progress.profile.dietaryPreferences.join(", ") : "None"}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-slate-500">Medical Conditions</dt>
            <dd>{progress.profile.medicalConditions?.length > 0 ? progress.profile.medicalConditions.join(", ") : "None"}</dd>
          </div>
        </dl>
      </SurfaceCard>

      <SurfaceCard title="Weight History" description="Lich su can nang">
        {!progress.weightHistory || progress.weightHistory.length === 0 ? (
          <p className="text-sm text-slate-600">Chua co lich su can nang.</p>
        ) : (
          <div className="space-y-3">
            {progress.weightHistory.map((w, idx) => (
              <div key={idx} className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <div className="font-medium">{w.weightValue} {w.weightUnit}</div>
                  <div className="text-xs text-slate-500">Source: {w.source}</div>
                </div>
                <div className="text-sm text-slate-500">{formatDate(w.loggedAt)}</div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard title="Body Measurements" description="Lich su so do">
        {!progress.measurementHistory || progress.measurementHistory.length === 0 ? (
          <p className="text-sm text-slate-600">Chua co lich su so do.</p>
        ) : (
          <div className="space-y-4">
            {progress.measurementHistory.map((m, idx) => (
              <div key={idx} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between mb-2">
                  <div className="text-sm text-slate-500">{formatDate(m.measuredAt)} - {m.source}</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  <div><span className="text-slate-500">Chest:</span> {m.chest || "-"} {m.unit}</div>
                  <div><span className="text-slate-500">Waist:</span> {m.waist || "-"} {m.unit}</div>
                  <div><span className="text-slate-500">Hips:</span> {m.hips || "-"} {m.unit}</div>
                  <div><span className="text-slate-500">Arms:</span> {m.arms || "-"} {m.unit}</div>
                  <div><span className="text-slate-500">Thighs:</span> {m.thighs || "-"} {m.unit}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
