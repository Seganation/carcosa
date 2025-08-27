"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { CreateBucketDialog } from "./create-bucket-dialog";

export function CreateBucketButton() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="bg-orange-500 hover:bg-orange-600"
      >
        <Plus className="h-4 w-4 mr-2" />
        Connect Bucket
      </Button>

      <CreateBucketDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}
