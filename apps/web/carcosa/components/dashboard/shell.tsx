"use client";

import { usePathname } from "next/navigation";
import { DashboardHeader } from "./header";
import { DashboardSidebar } from "./sidebar";
import { AppSidebar } from "./app-sidebar";
import { InvitationsBanner } from "./invitations-banner";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if we're in an app-specific route
  const isAppRoute = pathname.includes("/dashboard/app/");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* Container for full-width layout */}
      <div className="flex w-full">
        {/* Sidebar - hidden on mobile (md: and up) */}
        <aside className="hidden md:block w-64 border-r border-border bg-background h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
          {isAppRoute ? <AppSidebar /> : <DashboardSidebar />}
        </aside>

        {/* Main content area - full width */}
        <main className="flex-1 min-w-0">
          {isAppRoute ? (
            // App routes: centered content with proper padding
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
              <InvitationsBanner />
              {children}
            </div>
          ) : (
            // Dashboard routes: full-width content
            <div className="px-4 sm:px-6 py-6 sm:py-8">
              <InvitationsBanner />
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
