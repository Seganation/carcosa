"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth-context";

export type Team = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  members: TeamMember[];
  _count: {
    members: number;
    projects: number;
  };
};

export type TeamMember = {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  teams: Team[];
  members: OrganizationMember[];
  _count: {
    members: number;
    teams: number;
  };
};

export type OrganizationMember = {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type Invitation = {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
  team?: {
    id: string;
    name: string;
    organization: {
      id: string;
      name: string;
    };
  };
  organization?: {
    id: string;
    name: string;
  };
  invitedByUser: {
    id: string;
    name: string;
    email: string;
  };
};

type TeamContextType = {
  currentTeam: Team | null;
  teams: Team[];
  organizations: Organization[];
  invitations: Invitation[];
  loading: boolean;
  setCurrentTeam: (team: Team | null) => void;
  refreshTeams: () => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  refreshInvitations: () => Promise<void>;
  createOrganization: (data: CreateOrganizationData) => Promise<Organization>;
  createTeam: (data: CreateTeamData, organizationId: string) => Promise<Team>;
  inviteUser: (data: InviteUserData) => Promise<Invitation>;
  acceptInvitation: (invitationId: string) => Promise<void>;
};

type CreateOrganizationData = {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
};

type CreateTeamData = {
  name: string;
  slug: string;
  description?: string;
};

type InviteUserData = {
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  teamId?: string;
  organizationId?: string;
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}

type TeamProviderProps = {
  children: React.ReactNode;
};

export function TeamProvider({ children }: TeamProviderProps) {
  const { user } = useAuth();
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const refreshTeams = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/v1/organizations/teams`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
        
        // Auto-select first team if no team is currently selected
        if (!currentTeam && data.teams.length > 0) {
          setCurrentTeam(data.teams[0]);
        }
      }
    } catch (error) {
      console.error("Failed to refresh teams:", error);
    }
  };

  const refreshOrganizations = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/v1/organizations`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error("Failed to refresh organizations:", error);
    }
  };

  const refreshInvitations = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/v1/organizations/invitations`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations);
      }
    } catch (error) {
      console.error("Failed to refresh invitations:", error);
    }
  };

  const createOrganization = async (data: CreateOrganizationData): Promise<Organization> => {
    const response = await fetch(`${apiUrl}/api/v1/organizations`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create organization");
    }

    const result = await response.json();
    await refreshOrganizations();
    await refreshTeams();
    return result.organization;
  };

  const createTeam = async (data: CreateTeamData, organizationId: string): Promise<Team> => {
    const response = await fetch(`${apiUrl}/api/v1/organizations/${organizationId}/teams`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create team");
    }

    const result = await response.json();
    await refreshTeams();
    return result.team;
  };

  const inviteUser = async (data: InviteUserData): Promise<Invitation> => {
    const response = await fetch(`${apiUrl}/api/v1/organizations/invite`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to invite user");
    }

    const result = await response.json();
    await refreshInvitations();
    return result.invitation;
  };

  const acceptInvitation = async (invitationId: string): Promise<void> => {
    const response = await fetch(`${apiUrl}/api/v1/organizations/invitations/${invitationId}/accept`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to accept invitation");
    }

    await refreshTeams();
    await refreshOrganizations();
    await refreshInvitations();
  };

  // Load initial data
  useEffect(() => {
    if (user) {
      Promise.all([
        refreshTeams(),
        refreshOrganizations(),
        refreshInvitations(),
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const value: TeamContextType = {
    currentTeam,
    teams,
    organizations,
    invitations,
    loading,
    setCurrentTeam,
    refreshTeams,
    refreshOrganizations,
    refreshInvitations,
    createOrganization,
    createTeam,
    inviteUser,
    acceptInvitation,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}
