"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const refresh = async () => {
    try {
      console.log("🔄 Refreshing auth...");
      const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
        credentials: "include",
      });

      console.log("🔐 Auth response status:", response.status);
      console.log("🔐 Auth response headers:", Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Auth data:", data);
        setUser(data.user);
      } else {
        console.log("❌ Auth failed, status:", response.status);
        setUser(null);
      }
    } catch (error) {
      console.error("❌ Auth refresh error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Login failed");
    }

    const data = await response.json();
    // Store the JWT token in localStorage
    if (data.token) {
      localStorage.setItem("carcosa_token", data.token);
    }
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await fetch(`${apiUrl}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Remove the JWT token from localStorage
      localStorage.removeItem("carcosa_token");
      setUser(null);
    }
  };

  useEffect(() => {
    console.log("🚀 AuthProvider mounted, refreshing auth...");
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
