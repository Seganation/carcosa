"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { CreateAppDialog } from "./create-app-dialog";

interface CreateAppButtonProps {
  onSuccess?: () => void;
}

export function CreateAppButton({ onSuccess }: CreateAppButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="bg-orange-500 hover:bg-orange-600"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create New App
      </Button>

      <CreateAppDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={onSuccess}
      />
    </>
  );
}
