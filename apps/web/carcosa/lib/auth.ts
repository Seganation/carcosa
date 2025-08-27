"use client";

// Minimal client-only auth helper for Express auth endpoints.

export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

const TOKEN_KEY = "carcosa_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

export async function login(
  baseUrl: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("login_failed");
  const data = (await res.json()) as { token?: string; user: AuthUser };
  if (data.token) setToken(data.token);
  return data.user;
}

export async function logout(baseUrl: string): Promise<void> {
  try {
    await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    setToken(null);
  }
}

export async function me(baseUrl: string): Promise<AuthUser | null> {
  const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  const data: unknown = await res.json();
  return data && typeof data === "object" ? (data as AuthUser) : null;
}
