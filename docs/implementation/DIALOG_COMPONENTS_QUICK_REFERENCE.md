# Dialog Components - Quick Reference

## Existing Dialog Components (7 Total)

| Component | File | Operation | Status | Notes |
|-----------|------|-----------|--------|-------|
| CreateOrganizationDialog | create-organization-dialog.tsx | CREATE | COMPLETE | Auto-slug generation, optional description |
| CreateTeamDialog | create-team-dialog.tsx | CREATE | COMPLETE | Scoped to org, requires orgId |
| CreateProjectDialog | create-project-dialog.tsx | CREATE | COMPLETE | Multi-tenant toggle, bucket selection |
| CreateAppDialog | create-app-dialog.tsx | CREATE | COMPLETE | Similar to create-project, variant |
| CreateBucketDialog | create-bucket-dialog.tsx | CREATE | COMPLETE | S3/R2 support, credential encryption |
| InviteUserDialog | invite-user-dialog.tsx | CREATE | COMPLETE | Role-based, org or team level |
| BucketSharingDialog | bucket-sharing-dialog.tsx | UPDATE/DELETE | COMPLETE | Grant/revoke access, 3 permission levels |

## Inline Dialogs (In Other Components)

| Component | File | Operations | Status | Notes |
|-----------|------|-----------|--------|-------|
| Tenant Dialogs | app-tenants.tsx | CREATE/UPDATE/DELETE | COMPLETE (inline) | Needs extraction |
| API Key Dialogs | app-api-keys.tsx | CREATE/REGEN/REVOKE | COMPLETE (inline) | Needs extraction |
| Delete Project | app-settings.tsx | DELETE | INCOMPLETE (stub) | No API call implemented |

## Missing Core Dialogs (Priority: HIGH)

1. **edit-organization-dialog.tsx** - UPDATE org name/slug/desc
2. **delete-organization-dialog.tsx** - DELETE with warnings
3. **edit-team-dialog.tsx** - UPDATE team properties
4. **delete-team-dialog.tsx** - DELETE with cascade impact
5. **edit-member-role-dialog.tsx** - CHANGE role (OWNER/ADMIN/MEMBER/VIEWER)
6. **remove-member-dialog.tsx** - DELETE member with confirmation

## Missing Secondary Dialogs (Priority: MEDIUM)

7. **edit-project-dialog.tsx** - UPDATE project properties
8. **delete-project-dialog.tsx** - DELETE project config
9. **edit-bucket-dialog.tsx** - UPDATE bucket name/creds/endpoint
10. **delete-bucket-dialog.tsx** - DISCONNECT bucket with warnings

## Missing Utility Dialogs (Priority: LOW)

11. **revoke-invitation-dialog.tsx** - CANCEL pending invitation
12. **edit-api-key-dialog.tsx** - UPDATE label/permissions (optional)

## Implementation Template

All new dialogs should follow this pattern:

```typescript
"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "react-hot-toast";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  // Add entity data props
}

export function NameDialog({
  open,
  onOpenChange,
  onSuccess,
}: DialogProps) {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // API call here
      toast.success("Success!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields */}
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Loading..." : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## Key Patterns from Existing Dialogs

1. **State Management**: Use `open` prop + `onOpenChange` callback
2. **Loading**: Disable buttons during submission
3. **Feedback**: Toast notifications for success/error
4. **Reset**: Clear form on successful submission or close
5. **Validation**: Validate before API call
6. **Callbacks**: Use `onSuccess` for parent refresh
7. **Styling**: Consistent button patterns (Cancel/Submit)
8. **Icons**: Use lucide-react for visual context

## Common Props Pattern

All dialogs should accept:
- `open: boolean` - Dialog visibility state
- `onOpenChange: (open: boolean) => void` - State setter
- `onSuccess?: () => void` - Parent refresh callback
- `[entity]Id?: string` - Entity to edit/delete
- `[entity]?: Entity` - Full entity data (for edit/delete)

## Files Needing Extraction

1. `/apps/web/carcosa/components/dashboard/app-tenants.tsx` (lines 265-375)
   - Extract: `edit-tenant-dialog.tsx`
   - Extract: inline delete logic

2. `/apps/web/carcosa/components/dashboard/app-api-keys.tsx` (lines 286-400+)
   - Extract: `create-api-key-dialog.tsx`
   - Extract: `revoke-api-key-dialog.tsx`
   - Extract: `regenerate-api-key-dialog.tsx`

3. `/apps/web/carcosa/components/dashboard/app-settings.tsx` (lines 154-202)
   - Extract: `delete-project-dialog.tsx`
   - Fix: Implement actual API call

## Coverage Summary

```
Organization: CREATE ✓ | EDIT ✗ | DELETE ✗ | READ ✓
  ├─ Teams: CREATE ✓ | EDIT ✗ | DELETE ✗ | READ ✓
  │   ├─ Members: INVITE ✓ | EDIT_ROLE ✗ | REMOVE ✗ | READ ✓
  │   └─ Projects: CREATE ✓ | EDIT ✗ | DELETE ✗ | READ ✓
  │       ├─ API Keys: CREATE ✓ | REGEN ✓ | REVOKE ✓ | READ ✓
  │       └─ Tenants: CREATE ✓ | EDIT ✓ | DELETE ✓ | READ ✓
  └─ Buckets: CREATE ✓ | EDIT ✗ | DELETE ✗ | READ ✓
      └─ Sharing: GRANT ✓ | REVOKE ✓ | READ ✓

Legend: ✓ Implemented | ✗ Missing
```

Total: 13 dialogable operations, 8 implemented, 5 missing from core UI
