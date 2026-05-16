"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  Check,
  Flame,
  Heart,
  Loader2,
  Ruler,
  Scale,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";

type HealthProfile = {
  dateOfBirth: string | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  goals: string[];
  activityLevel: string | null;
  medicalConditions: string | null;
  foodAllergies: string | null;
  notes: string | null;
  primaryGoal: string | null;
  dietaryPreferences: string[];
};

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

const GOAL_OPTIONS = [
  { id: "weight_loss", label: "Giảm cân" },
  { id: "muscle_gain", label: "Tăng cơ" },
  { id: "flexibility", label: "Dẻo dai" },
  { id: "endurance", label: "Sức bền" },
  { id: "health", label: "Sức khỏe" },
  { id: "recovery", label: "Phục hồi" },
] as const;

const ACTIVITY_OPTIONS = [
  {
    id: "sedentary",
    icon: Sparkles,
    label: "Ít vận động",
    description: "Hầu như ngồi, không tập luyện",
  },
  {
    id: "light",
    icon: Zap,
    label: "Nhẹ",
    description: "Tập 1–3 ngày/tuần",
  },
  {
    id: "moderate",
    icon: Flame,
    label: "Trung bình",
    description: "Tập 3–5 ngày/tuần",
  },
  {
    id: "active",
    icon: Activity,
    label: "Năng động",
    description: "Tập 6–7 ngày/tuần",
  },
] as const;

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--blush)] bg-white shadow-[0_4px_20px_rgba(255,107,157,0.08)] p-5">
      {children}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--pastel-pink)]">
        <Icon className="h-3.5 w-3.5 text-[var(--primary-pink)]" />
      </div>
      <h3 className="text-sm font-bold text-[var(--black)]">{title}</h3>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-[var(--gray-500)] mb-1.5">{children}</p>
  );
}

type HealthFormValues = {
  dateOfBirth: string;
  gender: string;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  goals: string[];
  activityLevel: string;
  medicalConditions: string;
  foodAllergies: string;
  notes: string;
};

function getInitialHealthFormValues(
  profile?: HealthProfile,
  progress?: HealthProgress
): HealthFormValues {
  if (profile) {
    return {
      dateOfBirth: profile.dateOfBirth ?? "",
      gender: profile.gender ?? "",
      heightCm: profile.heightCm ?? 165,
      weightKg: profile.weightKg ?? 60,
      targetWeightKg: profile.targetWeightKg ?? 55,
      goals: profile.goals ?? [],
      activityLevel: profile.activityLevel ?? "",
      medicalConditions: Array.isArray(profile.medicalConditions)
        ? profile.medicalConditions.join(", ")
        : (profile.medicalConditions ?? ""),
      foodAllergies: profile.foodAllergies ?? "",
      notes: profile.notes ?? "",
    };
  }

  return {
    dateOfBirth: "",
    gender: "",
    heightCm: 165,
    weightKg: progress?.weightHistory?.length
      ? parseFloat(progress.weightHistory[0].weightValue) || 60
      : 60,
    targetWeightKg: progress?.profile.targetWeight
      ? parseFloat(progress.profile.targetWeight) || 55
      : 55,
    goals: progress?.profile.primaryGoal ? [progress.profile.primaryGoal] : [],
    activityLevel: "",
    medicalConditions: progress?.profile.medicalConditions?.join(", ") ?? "",
    foodAllergies: "",
    notes: progress?.profile.notes ?? "",
  };
}

function SliderInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value || ""}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
          }}
          className="myfit-input w-24 text-center text-sm font-bold"
          style={{ height: 40 }}
        />
        <span className="text-sm font-medium text-[var(--gray-500)]">{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value || min}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--primary-pink) 0%, var(--primary-pink) ${
            ((( value || min) - min) / (max - min)) * 100
          }%, var(--gray-300) ${(((value || min) - min) / (max - min)) * 100}%, var(--gray-300) 100%)`,
          accentColor: "var(--primary-pink)",
        }}
      />
      <div className="flex justify-between text-[10px] text-[var(--gray-500)]">
        <span>{min} {suffix}</span>
        <span>{max} {suffix}</span>
      </div>
    </div>
  );
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

  const profileQuery = useQuery({
    queryKey: ["member-health-profile"],
    queryFn: async () => {
      const response = await authorizedRequest<HealthProfile>("/api/v1/health/profile");
      return response.data;
    },
  });

  const isLoading = progressQuery.isLoading && profileQuery.isLoading;
  const isError = progressQuery.isError && profileQuery.isError;
  const initialValues = getInitialHealthFormValues(profileQuery.data, progressQuery.data);
  const editorKey = useMemo(
    () => JSON.stringify(initialValues),
    [initialValues]
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-[var(--gray-500)]">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--gray-300)] border-t-[var(--primary-pink)]" />
        Đang tải dữ liệu sức khỏe...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-[var(--rose-error)]/30 bg-red-50 px-4 py-3 text-sm text-[var(--rose-error)]">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        Không tải được dữ liệu sức khỏe.
      </div>
    );
  }

  return (
    <MemberHealthEditor
      key={editorKey}
      initialValues={initialValues}
      authorizedRequest={authorizedRequest}
    />
  );
}

function MemberHealthEditor({
  initialValues,
  authorizedRequest,
}: {
  initialValues: HealthFormValues;
  authorizedRequest: ReturnType<typeof useAuth>["authorizedRequest"];
}) {
  const queryClient = useQueryClient();
  const [dateOfBirth, setDateOfBirth] = useState(initialValues.dateOfBirth);
  const [gender, setGender] = useState(initialValues.gender);
  const [heightCm, setHeightCm] = useState(initialValues.heightCm);
  const [weightKg, setWeightKg] = useState(initialValues.weightKg);
  const [targetWeightKg, setTargetWeightKg] = useState(initialValues.targetWeightKg);
  const [goals, setGoals] = useState<string[]>(initialValues.goals);
  const [activityLevel, setActivityLevel] = useState(initialValues.activityLevel);
  const [medicalConditions, setMedicalConditions] = useState(initialValues.medicalConditions);
  const [foodAllergies, setFoodAllergies] = useState(initialValues.foodAllergies);
  const [notes, setNotes] = useState(initialValues.notes);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  async function handleSave() {
    if (saveState === "saving") return;
    setSaveState("saving");
    try {
      await authorizedRequest("/api/v1/health/profile", {
        method: "PUT",
        body: JSON.stringify({
          dateOfBirth: dateOfBirth || null,
          gender: gender || null,
          heightCm: heightCm || null,
          weightKg: weightKg || null,
          targetWeightKg: targetWeightKg || null,
          goals,
          activityLevel: activityLevel || null,
          medicalConditions: medicalConditions || null,
          foodAllergies: foodAllergies || null,
          notes: notes || null,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["member-health-progress"] });
      await queryClient.invalidateQueries({ queryKey: ["member-health-profile"] });
      setSaveState("saved");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      setSaveState("idle");
      toast.error(err instanceof Error ? err.message : "Lưu thất bại. Vui lòng thử lại.");
    }
  }

  function toggleGoal(id: string) {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  return (
    <div className="max-w-lg pb-28">
      <div
        className="rounded-2xl mb-5 px-5 py-5"
        style={{
          background: "linear-gradient(135deg, var(--lavender) 0%, var(--soft-pink) 100%)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Heart className="h-5 w-5 text-[var(--deep-pink)]" />
          <h2 className="text-lg font-extrabold text-[var(--black)]">Hồ sơ sức khỏe</h2>
        </div>
        <p className="text-sm text-[var(--gray-500)]">
          Cập nhật thông tin để nhận lịch tập phù hợp nhất với bạn.
        </p>
      </div>

      <div className="space-y-4">
        <SectionCard>
          <SectionTitle icon={Ruler} title="Thông tin cơ bản" />

          <div className="space-y-4">
            <div>
              <FieldLabel>Ngày sinh</FieldLabel>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="myfit-input"
              />
            </div>

            <div>
              <FieldLabel>Giới tính</FieldLabel>
              <div className="flex gap-2">
                {[
                  { value: "male", label: "Nam" },
                  { value: "female", label: "Nữ" },
                  { value: "other", label: "Khác" },
                ].map((opt) => {
                  const active = gender === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGender(opt.value)}
                      className="flex-1 rounded-full py-2 text-sm font-semibold border transition-all"
                      style={{
                        background: active ? "var(--primary-pink)" : "transparent",
                        color: active ? "white" : "var(--gray-500)",
                        borderColor: active ? "var(--primary-pink)" : "var(--gray-300)",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <FieldLabel>Chiều cao</FieldLabel>
              <SliderInput
                value={heightCm}
                onChange={setHeightCm}
                min={100}
                max={220}
                suffix="cm"
              />
            </div>

            <div>
              <FieldLabel>Cân nặng hiện tại</FieldLabel>
              <SliderInput
                value={weightKg}
                onChange={setWeightKg}
                min={30}
                max={200}
                step={0.5}
                suffix="kg"
              />
            </div>

            <div>
              <FieldLabel>Cân nặng mục tiêu</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={targetWeightKg || ""}
                  min={30}
                  max={200}
                  step={0.5}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value);
                    if (!isNaN(n)) setTargetWeightKg(n);
                  }}
                  className="myfit-input w-24 text-center text-sm font-bold"
                  style={{ height: 40 }}
                  placeholder="55"
                />
                <span className="text-sm font-medium text-[var(--gray-500)]">kg</span>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionTitle icon={Target} title="Mục tiêu tập luyện" />
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((goal) => {
              const active = goals.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className="rounded-full px-4 py-1.5 text-sm font-semibold border transition-all"
                  style={{
                    background: active ? "var(--primary-pink)" : "transparent",
                    color: active ? "white" : "var(--gray-500)",
                    borderColor: active ? "var(--primary-pink)" : "var(--gray-300)",
                  }}
                >
                  {goal.label}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionTitle icon={Zap} title="Mức độ vận động" />
          <div className="space-y-2">
            {ACTIVITY_OPTIONS.map((opt) => {
              const active = activityLevel === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setActivityLevel(opt.id)}
                  className="w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all"
                  style={{
                    borderColor: active ? "var(--primary-pink)" : "var(--blush)",
                    background: active ? "var(--pastel-pink)" : "white",
                  }}
                >
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: active ? "var(--primary-pink)" : "var(--gray-100)",
                    }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: active ? "white" : "var(--gray-500)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold"
                      style={{ color: active ? "var(--deep-pink)" : "var(--black)" }}
                    >
                      {opt.label}
                    </p>
                    <p className="text-xs text-[var(--gray-500)]">{opt.description}</p>
                  </div>
                  {active && (
                    <Check className="h-4 w-4 flex-shrink-0 text-[var(--primary-pink)]" />
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionTitle icon={Scale} title="Sức khỏe & dinh dưỡng" />
          <div className="space-y-4">
            <div>
              <FieldLabel>Tình trạng sức khỏe / bệnh lý</FieldLabel>
              <textarea
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                rows={3}
                placeholder="VD: Huyết áp cao, đau lưng mãn tính..."
                className="myfit-input w-full resize-none py-3 leading-relaxed"
                style={{ height: "auto" }}
              />
            </div>
            <div>
              <FieldLabel>Dị ứng thực phẩm</FieldLabel>
              <textarea
                value={foodAllergies}
                onChange={(e) => setFoodAllergies(e.target.value)}
                rows={2}
                placeholder="VD: Gluten, sữa, hải sản..."
                className="myfit-input w-full resize-none py-3 leading-relaxed"
                style={{ height: "auto" }}
              />
            </div>
            <div>
              <FieldLabel>Ghi chú thêm</FieldLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ghi chú bổ sung cho huấn luyện viên..."
                className="myfit-input w-full resize-none py-3 leading-relaxed"
                style={{ height: "auto" }}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-20 px-4 py-4"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--blush)",
        }}
      >
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState === "saving"}
            className="myfit-btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={
              saveState === "saved"
                ? { background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }
                : {}
            }
          >
            {saveState === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveState === "saved" && <Check className="h-4 w-4" />}
            {saveState === "idle" && "Lưu hồ sơ sức khỏe"}
            {saveState === "saving" && "Đang lưu..."}
            {saveState === "saved" && "Đã lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

