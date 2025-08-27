"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { useTeam } from "../../contexts/team-context";
import {
  Box,
  Database,
  User,
  FileText,
  Settings,
  BarChart3,
  Users,
  Image,
  Shield,
  Building2,
  Home,
  ChevronRight,
  ChevronDown,
  Rocket,
} from "lucide-react";
import { useState } from "react";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { currentTeam, teams } = useTeam();
  const [teamsExpanded, setTeamsExpanded] = useState(true);

  // Organization-level navigation (when user is at org level)
  const organizationNavItems = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Apps",
      href: "/dashboard/apps",
      icon: Box,
    },
    {
      title: "Teams",
      href: "/dashboard/teams",
      icon: Users,
    },
    {
      title: "Buckets",
      href: "/dashboard/buckets",
      icon: Database,
    },
    {
      title: "Usage",
      href: "/dashboard/usage",
      icon: BarChart3,
    },
    {
      title: "Audit Logs",
      href: "/dashboard/audit-logs",
      icon: Shield,
    },
    {
      title: "🚀 Carcosa Demo",
      href: "/dashboard/carcosa-demo",
      icon: Rocket,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  // Team-level navigation (when user is viewing a specific team)
  const teamNavItems = [
    {
      title: "Apps/Projects",
      href: "/dashboard",
      icon: Box,
    },
    {
      title: "Tenants",
      href: "/dashboard/tenants",
      icon: Users,
    },
    {
      title: "Transforms",
      href: "/dashboard/transforms",
      icon: Image,
    },
    {
      title: "Files",
      href: "/dashboard/files",
      icon: FileText,
    },
    {
      title: "Settings",
      href: "/dashboard/team-settings",
      icon: Settings,
    },
  ];

  // User account navigation (always visible)
  const userNavItems = [
    {
      title: "Account",
      href: "/dashboard/account",
      icon: User,
    },
  ];

  // Determine current context based on pathname
  const isInTeamContext = pathname.includes("/app/") || currentTeam;
  const isInOrganizationContext = !isInTeamContext;

  return (
    <nav className="space-y-2 p-4">
      {/* Organization Section */}
      {currentTeam && (
        <>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {currentTeam.organization.name}
          </div>
          
          {organizationNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-orange-500/10 text-orange-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}

          {/* Teams Section */}
          <div className="mt-6">
            <button
              onClick={() => setTeamsExpanded(!teamsExpanded)}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 w-full"
            >
              {teamsExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Teams
            </button>
            
            {teamsExpanded && (
              <div className="space-y-1 ml-2">
                {teams.map((team) => {
                  const isCurrentTeam = currentTeam?.id === team.id;
                  return (
                    <Link
                      key={team.id}
                      href={`/dashboard/team/${team.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isCurrentTeam
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <Users className="h-4 w-4" />
                      {team.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* User Account Section */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Account
        </div>
        
        {userNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-orange-500/10 text-orange-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
