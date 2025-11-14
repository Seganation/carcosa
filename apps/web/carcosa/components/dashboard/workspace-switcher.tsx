"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@carcosa/ui";
import { Building2, Users, ChevronDown, Check, User } from "lucide-react";
import { useTeam } from "../../contexts/team-context";
import { toast } from "react-hot-toast";

export function WorkspaceSwitcher() {
  const { currentTeam, teams, organizations, setCurrentTeam } = useTeam();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Load persisted selection from localStorage
    if (mounted && currentTeam) {
      localStorage.setItem("carcosa_current_team_id", currentTeam.id);
      localStorage.setItem(
        "carcosa_current_org_id",
        currentTeam.organization.id
      );
    }
  }, [currentTeam, mounted]);

  if (!mounted || !currentTeam) {
    return null;
  }

  // Group teams by organization
  const teamsByOrg = teams.reduce((acc, team) => {
    const orgId = team.organization.id;
    if (!acc[orgId]) {
      acc[orgId] = {
        organization: team.organization,
        teams: [],
      };
    }
    acc[orgId].teams.push(team);
    return acc;
  }, {} as Record<string, { organization: any; teams: any[] }>);

  const handleTeamChange = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      setCurrentTeam(team);
      toast.success(`Switched to ${team.name}`);
    }
  };

  // Check if organization is a personal workspace (single member)
  const isPersonalWorkspace = (orgId: string) => {
    const orgTeams = teamsByOrg[orgId]?.teams || [];
    // Consider it personal if it has only one team
    return orgTeams.length === 1;
  };

  const getWorkspaceLabel = () => {
    if (isPersonalWorkspace(currentTeam.organization.id)) {
      return "Personal Workspace";
    }
    return currentTeam.organization.name;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 px-3 min-w-[160px] sm:min-w-[200px] justify-between"
          aria-label={`Current workspace: ${currentTeam.name} in ${getWorkspaceLabel()}`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-sm font-medium truncate">{currentTeam.name}</span>
              <span className="text-xs text-muted-foreground truncate">
                {getWorkspaceLabel()}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[280px] sm:w-[320px]" align="start">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Switch Workspace</p>
            <p className="text-xs leading-none text-muted-foreground">
              Select an organization and team
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {Object.values(teamsByOrg).map(({ organization, teams: orgTeams }) => {
          const isPersonal = isPersonalWorkspace(organization.id);
          const workspaceName = isPersonal ? "Personal Workspace" : organization.name;

          return (
            <DropdownMenuGroup key={organization.id}>
              <DropdownMenuLabel className="flex items-center gap-2 py-2">
                {isPersonal ? (
                  <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="font-medium">{workspaceName}</span>
              </DropdownMenuLabel>

              {orgTeams.map((team) => {
                const isSelected = currentTeam.id === team.id;
                return (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() => handleTeamChange(team.id)}
                    className={`cursor-pointer pl-8 ${
                      isSelected ? "bg-accent" : ""
                    }`}
                    role="menuitemradio"
                    aria-checked={isSelected}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm">{team.name}</span>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />
            </DropdownMenuGroup>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
