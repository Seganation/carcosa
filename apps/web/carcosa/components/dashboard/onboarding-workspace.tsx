"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Building2, Rocket, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface OnboardingWorkspaceProps {
  onWorkspaceCreated?: () => void;
}

export function OnboardingWorkspace({ onWorkspaceCreated }: OnboardingWorkspaceProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInitializeWorkspace = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/v1/organizations/initialize`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to initialize workspace");
      }

      const data = await response.json();

      toast.success("Workspace created successfully! 🎉");

      // Call the callback to refresh the parent component
      if (onWorkspaceCreated) {
        onWorkspaceCreated();
      }

      // Refresh the page to load the new organization
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error: any) {
      console.error("Failed to initialize workspace:", error);
      toast.error(error.message || "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <Card className="max-w-2xl w-full shadow-lg border-2">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto bg-gradient-to-br from-orange-500/10 to-purple-500/10 w-20 h-20 rounded-full flex items-center justify-center">
            <Building2 className="h-10 w-10 text-orange-500" />
          </div>
          <div>
            <CardTitle className="text-3xl mb-2">Welcome to Carcosa!</CardTitle>
            <CardDescription className="text-base">
              Let's get you started by setting up your workspace
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg mt-1">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Your Personal Workspace</h3>
                <p className="text-sm text-muted-foreground">
                  We'll create a personalized workspace just for you. You'll get your own organization
                  and a default team to start building with.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg mt-1">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Full Access to Features</h3>
                <p className="text-sm text-muted-foreground">
                  Once your workspace is set up, you'll have immediate access to all Carcosa features:
                  file uploads, transforms, API keys, team management, and more.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleInitializeWorkspace}
              disabled={loading}
              size="lg"
              className="w-full text-base h-12"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating your workspace...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5 mr-2" />
                  Create My Workspace
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              This will create a new organization and team for you. You can customize it later.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
