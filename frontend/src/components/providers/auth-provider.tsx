"use client";

import { jwtDecode } from "jwt-decode";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, apiRequest } from "@/lib/api/client";
import { clearRefreshToken, getRefreshToken, setRefreshToken } from "@/lib/auth/token-storage";
import type { ApiEnvelope, UserRole } from "@/lib/api/types";

type AccessTokenClaims = {
  sub: string;
  primaryRole?: UserRole;
  branchIds?: string[];
  exp?: number;
  iat?: number;
  type?: string;
};

type AuthSession = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: UserRole;
  branchIds: string[];
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  session: AuthSession | null;
  isHydrating: boolean;
  login: (input: LoginInput) => Promise<UserRole>;
  refresh: () => Promise<string | null>;
  logout: () => Promise<void>;
  authorizedRequest: <T>(path: string, init?: RequestInit) => Promise<ApiEnvelope<T>>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function buildSession(accessToken: string, refreshToken: string): AuthSession {
  const claims = jwtDecode<AccessTokenClaims>(accessToken);

  return {
    accessToken,
    refreshToken,
    userId: claims.sub,
    role: claims.primaryRole ?? "GUEST",
    branchIds: Array.isArray(claims.branchIds) ? claims.branchIds : [],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const refresh = useCallback(async () => {
    const storedRefreshToken = getRefreshToken();
    if (!storedRefreshToken) {
      setSession(null);
      return null;
    }

    try {
      const response = await apiRequest<{ accessToken: string; refreshToken: string }>("/api/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      setRefreshToken(response.data.refreshToken);
      const nextSession = buildSession(response.data.accessToken, response.data.refreshToken);
      setSession(nextSession);
      return nextSession.accessToken;
    } catch {
      clearRefreshToken();
      setSession(null);
      return null;
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refresh();
      setIsHydrating(false);
    })();
  }, [refresh]);

  const login = useCallback(async (input: LoginInput) => {
    const response = await apiRequest<{ accessToken: string; refreshToken: string }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });

    setRefreshToken(response.data.refreshToken);
    const nextSession = buildSession(response.data.accessToken, response.data.refreshToken);
    setSession(nextSession);
    router.refresh();
    return nextSession.role;
  }, [router]);

  const logout = useCallback(async () => {
    const currentRefreshToken = session?.refreshToken ?? getRefreshToken();

    if (currentRefreshToken) {
      try {
        await apiRequest<{ success: boolean }>("/api/v1/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
        });
      } catch {
        // swallow logout errors in MVP client
      }
    }

    clearRefreshToken();
    setSession(null);
    router.push("/login");
    router.refresh();
  }, [router, session?.refreshToken]);

  const authorizedRequest = useCallback(async <T,>(path: string, init?: RequestInit) => {
    let accessToken: string | null = session?.accessToken ?? null;
    if (!accessToken) {
      accessToken = await refresh();
    }

    if (!accessToken) {
      throw new ApiRequestError("Unauthorized", 401, "UNAUTHORIZED");
    }

    try {
      return await apiRequest<T>(path, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      if (!(error instanceof ApiRequestError) || error.status !== 401) {
        throw error;
      }

      const refreshedAccessToken = await refresh();
      if (!refreshedAccessToken) {
        throw error;
      }

      return apiRequest<T>(path, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          authorization: `Bearer ${refreshedAccessToken}`,
        },
      });
    }
  }, [refresh, session?.accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, isHydrating, login, refresh, logout, authorizedRequest }),
    [session, isHydrating, login, refresh, logout, authorizedRequest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
