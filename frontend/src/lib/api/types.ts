export type ApiEnvelope<T> = {
  data: T;
  error: ApiError | null;
  meta: Record<string, unknown>;
};

export type ApiError = {
  code: string;
  message: string;
};

export type UserRole = "ADMIN" | "MANAGER" | "COACH" | "MEMBER" | "GUEST";
