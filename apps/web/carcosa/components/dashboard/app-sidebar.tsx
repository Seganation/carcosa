"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "../../lib/utils";
import { BarChart3, Key, Files, Settings, ArrowLeft, Users, Image, Activity } from "lucide-react";
import { Button } from "../ui/button";

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const appId = params.id as string;

  const appNavItems = [
    {
      title: "Overview",
      href: `/dashboard/app/${appId}`,
      icon: BarChart3,
    },
    {
      title: "Files",
      href: `/dashboard/app/${appId}/files`,
      icon: Files,
    },
    {
      title: "Tenants",
      href: `/dashboard/app/${appId}/tenants`,
      icon: Users,
    },
    {
      title: "API Keys",
      href: `/dashboard/app/${appId}/api-keys`,
      icon: Key,
    },
    {
      title: "Transforms",
      href: `/dashboard/app/${appId}/transforms`,
      icon: BarChart3,
    },
    {
      title: "Usage",
      href: `/dashboard/app/${appId}/usage`,
      icon: Activity,
    },
    {
      title: "Audit Logs",
      href: `/dashboard/app/${appId}/audit-logs`,
      icon: Activity,
    },
    {
      title: "Settings",
      href: `/dashboard/app/${appId}/settings`,
      icon: Settings,
    },
  ];

  return (
    <nav className="space-y-2 p-4">
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Apps
          </Link>
        </Button>
      </div>

      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        App Management
      </div>

      {appNavItems.map((item) => {
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
    </nav>
  );
}
