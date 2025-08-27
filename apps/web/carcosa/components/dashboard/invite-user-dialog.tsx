"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@carcosa/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@carcosa/ui";
import { Mail, Plus, Users, Building2 } from "lucide-react";
import { useTeam } from "../../contexts/team-context";
import { toast } from "react-hot-toast";

interface InviteUserDialogProps {
  organizationId?: string;
  teamId?: string;
  organizationName?: string;
  teamName?: string;
}

export function InviteUserDialog({ 
  organizationId, 
  teamId, 
  organizationName, 
  teamName 
}: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "MEMBER" as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER",
  });

  const { inviteUser } = useTeam();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      await inviteUser({
        email: formData.email.trim(),
        role: formData.role,
        teamId,
        organizationId,
      });
      
      toast.success("Invitation sent successfully!");
      setOpen(false);
      setFormData({ email: "", role: "MEMBER" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send invitation";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getDialogTitle = () => {
    if (teamId && teamName) {
      return `Invite to ${teamName}`;
    }
    if (organizationId && organizationName) {
      return `Invite to ${organizationName}`;
    }
    return "Invite User";
  };

  const getDialogDescription = () => {
    if (teamId && teamName) {
      return `Send an invitation to join the ${teamName} team.`;
    }
    if (organizationId && organizationName) {
      return `Send an invitation to join the ${organizationName} organization.`;
    }
    return "Send an invitation to join your organization or team.";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER") => 
                setFormData(prev => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Owner - Full access and control
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Admin - Manage members and settings
                  </div>
                </SelectItem>
                <SelectItem value="MEMBER">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Member - Full access to resources
                  </div>
                </SelectItem>
                <SelectItem value="VIEWER">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Viewer - Read-only access
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.role === "OWNER" && "Can manage everything including deleting the organization/team"}
              {formData.role === "ADMIN" && "Can manage members, settings, and resources"}
              {formData.role === "MEMBER" && "Can access and modify resources"}
              {formData.role === "VIEWER" && "Can only view resources, no modifications allowed"}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
