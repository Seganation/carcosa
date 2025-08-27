"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Moon, Sun, ChevronRight, LogOut, Building2, Users, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/auth-context";
import { useTeam } from "../../contexts/team-context";
import { projectsAPI } from "../../lib/projects-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@carcosa/ui";
import { toast } from "react-hot-toast";

export function DashboardHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { currentTeam, teams, organizations, setCurrentTeam } = useTeam();
  const [appName, setAppName] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch app name when in app route
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 3 && segments[1] === "app" && segments[2]) {
      const appId = segments[2];
      // Only fetch if it looks like a valid app ID (not a known route segment)
      if (!["files", "tenants", "api-keys", "settings"].includes(appId)) {
        projectsAPI.get(appId)
          .then(project => setAppName(project.name))
          .catch(() => setAppName(null));
      }
    } else {
      setAppName(null);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleTeamChange = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setCurrentTeam(team);
      toast.success(`Switched to ${team.name}`);
    }
  };

  // Generate breadcrumbs from pathname with org > team > page hierarchy
  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    // Only show org > team breadcrumbs if we have a current team
    if (currentTeam) {
      // Organization
      breadcrumbs.push({ 
        label: currentTeam.organization.name, 
        href: "/dashboard/organizations",
        isOrg: true
      });

      // Team
      breadcrumbs.push({ 
        label: currentTeam.name, 
        href: "/dashboard",
        isTeam: true
      });
    }

    // Skip "dashboard" segment if it's the first one, as we already have org/team context
    const startIndex = segments[0] === "dashboard" ? 1 : 0;

    for (let i = startIndex; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment) continue;

      const href = "/" + segments.slice(0, i + 1).join("/");

      // Handle special cases
      let label = segment;
      
      if (segment === "app") {
        label = "App";
      } else if (segment === "apps") {
        label = "Apps";
      } else if (segment === "api-keys") {
        label = "API Keys";
      } else if (segment === "files") {
        label = "Files";
      } else if (segment === "tenants") {
        label = "Tenants";
      } else if (segment === "settings") {
        label = "Settings";
      } else if (segment === "organizations") {
        label = "Organizations";
      } else if (segment === "teams") {
        label = "Teams";
      } else if (segment === "team") {
        label = "Team";
      } else if (segment === "buckets") {
        label = "Buckets";
      } else if (segment === "transforms") {
        label = "Transforms";
      } else if (segment === "usage") {
        label = "Usage";
      } else if (segment === "audit-logs") {
        label = "Audit Logs";
      } else if (segment === "account") {
        label = "Account";
      } else if (i === 2 && segments[1] === "app") {
        // This is the app ID, use the fetched app name or show loading
        if (appName) {
          label = appName;
        } else {
          label = "Loading...";
        }
      } else {
        // Capitalize and format other segment names
        label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }

      breadcrumbs.push({ label, href });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (!mounted) {
    return null;
  }

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        {/* Left side - Logo and Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-orange-500">
            Carcosa
          </Link>

          {/* Team Selector */}
          {teams.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-8 px-3">
                  <Building2 className="h-4 w-4 mr-2" />
                  {currentTeam ? currentTeam.name : "Select Team"}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Select Team</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentTeam?.organization.name}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {teams.map((team) => (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() => handleTeamChange(team.id)}
                    className={`cursor-pointer ${
                      currentTeam?.id === team.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{team.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {team.organization.name}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="h-3 w-3" />}
                  <Link
                    href={crumb.href}
                    className={`
                      ${index === breadcrumbs.length - 1
                        ? "text-foreground font-medium"
                        : "hover:text-foreground transition-colors"
                      }
                      ${(crumb as any).isOrg ? "text-blue-600 dark:text-blue-400" : ""}
                      ${(crumb as any).isTeam ? "text-green-600 dark:text-green-400" : ""}
                    `}
                  >
                    {(crumb as any).isOrg && <Building2 className="h-3 w-3 mr-1 inline" />}
                    {(crumb as any).isTeam && <Users className="h-3 w-3 mr-1 inline" />}
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </nav>
          )}
        </div>

        {/* Right side - Theme toggle and User avatar */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.name || "User"} />
                  <AvatarFallback className="bg-orange-500 text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  {currentTeam && (
                    <p className="text-xs leading-none text-muted-foreground">
                      Team: {currentTeam.name}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
