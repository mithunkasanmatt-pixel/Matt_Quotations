"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user session on mount
  React.useEffect(() => {
    async function checkSession() {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        if (pathname !== "/login") {
          router.replace("/login");
        }
        return;
      }

      const res = await apiFetch("/auth/me");
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        // Token invalid or expired
        localStorage.removeItem("auth_token");
        setUser(null);
        if (pathname !== "/login") {
          router.replace("/login");
        }
      }
      setLoading(false);
    }
    checkSession();
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.token && res.user) {
      localStorage.setItem("auth_token", res.token);
      setUser(res.user);
      setLoading(false);
      router.push("/dashboard");
      return { success: true };
    }

    setLoading(false);
    return { success: false, message: res.message || "Failed to log in" };
  };

  const logout = async () => {
    setLoading(true);
    await apiFetch("/auth/logout", { method: "POST" });
    localStorage.removeItem("auth_token");
    setUser(null);
    setLoading(false);
    router.replace("/login");
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
