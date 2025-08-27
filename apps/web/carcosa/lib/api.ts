"use client";

export function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

export function withAuth(headers: HeadersInit = {}): HeadersInit {
  if (typeof window === "undefined") return headers;
  try {
    const token = localStorage.getItem("carcosa_token");
    if (token) return { ...headers, authorization: `Bearer ${token}` };
  } catch {}
  return headers;
}


