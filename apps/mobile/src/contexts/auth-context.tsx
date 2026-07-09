import type { UserDTO, LoginInput, RegisterInput, UpdateProfileInput } from "@vmf/shared";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { apiFetch, configureApiClient, ApiError } from "@/lib/api-client";
import { getStoredRefreshToken, setStoredRefreshToken, clearStoredRefreshToken } from "@/lib/token-storage";

interface AuthResponse {
  user: UserDTO;
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}

interface AuthContextValue {
  user: UserDTO | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    configureApiClient(
      () => accessTokenRef.current,
      (token) => {
        accessTokenRef.current = token;
      }
    );
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const storedRefreshToken = await getStoredRefreshToken();
      if (!storedRefreshToken) {
        setUser(null);
        return;
      }
      const data = await apiFetch<AuthResponse>("/auth/refresh", {
        method: "POST",
        body: { refreshToken: storedRefreshToken },
        skipAuthRetry: true,
      });
      accessTokenRef.current = data.accessToken;
      if (data.refreshToken) await setStoredRefreshToken(data.refreshToken);
      setUser(data.user);
    } catch {
      await clearStoredRefreshToken();
      accessTokenRef.current = null;
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (input: LoginInput) => {
    const data = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: input,
      skipAuthRetry: true,
    });
    accessTokenRef.current = data.accessToken;
    if (data.refreshToken) await setStoredRefreshToken(data.refreshToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: input,
      skipAuthRetry: true,
    });
    accessTokenRef.current = data.accessToken;
    if (data.refreshToken) await setStoredRefreshToken(data.refreshToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      const storedRefreshToken = await getStoredRefreshToken();
      await apiFetch("/auth/logout", {
        method: "POST",
        body: storedRefreshToken ? { refreshToken: storedRefreshToken } : undefined,
        skipAuthRetry: true,
      });
    } finally {
      await clearStoredRefreshToken();
      accessTokenRef.current = null;
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const data = await apiFetch<{ user: UserDTO }>("/auth/me", {
      method: "PATCH",
      body: input,
    });
    setUser(data.user);
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await apiFetch<{ user: UserDTO }>("/auth/me");
    setUser(data.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export { ApiError };
