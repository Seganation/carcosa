"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/auth-context";

type ProtectedRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

/**
 * ProtectedRoute Component
 *
 * Wraps components that require authentication.
 * Redirects to login if user is not authenticated.
 *
 * Usage:
 * ```tsx
 * export default function DashboardPage() {
 *   return (
 *     <ProtectedRoute>
 *       <DashboardContent />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */
export function ProtectedRoute({ children, redirectTo = "/auth/login" }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Save the current path to redirect back after login
      const currentPath = window.location.pathname;
      if (currentPath !== redirectTo) {
        sessionStorage.setItem("carcosa_redirect_after_login", currentPath);
      }
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!user) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
