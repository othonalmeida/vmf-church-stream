"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { UserDTO, LoginInput, RegisterInput, UpdateProfileInput } from "@vmf/shared";
import { apiFetch, configureApiClient, ApiError } from "@/lib/api-client";

interface AuthResponse {
  user: UserDTO;
  accessToken: string;
  expiresIn: number;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
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
      const data = await apiFetch<AuthResponse>("/auth/refresh", { method: "POST" });
      accessTokenRef.current = data.accessToken;
      setUser(data.user);
    } catch {
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
    setUser(data.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: input,
      skipAuthRetry: true,
    });
    accessTokenRef.current = data.accessToken;
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST", skipAuthRetry: true });
    } finally {
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
