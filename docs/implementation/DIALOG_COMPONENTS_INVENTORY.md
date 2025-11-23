# Carcosa Dashboard Dialog Components - Comprehensive Inventory Report

**Generated:** 2025-11-14
**Scope:** `/apps/web/carcosa/components/dashboard/`

---

## Executive Summary

**Total Dialog Components Found:** 7
- **Complete/Functional:** 7
- **Incomplete/Stub:** 0
- **Missing Critical Dialogs:** 9+

The dashboard has basic CRUD dialogs for core entities (organizations, teams, projects, buckets) but lacks many important edit/delete dialogs for complete CRUD operations across all entities.

---

## EXISTING DIALOG COMPONENTS

### 1. Create Organization Dialog
**File:** `/apps/web/carcosa/components/dashboard/create-organization-dialog.tsx`
- **Operation:** CREATE
- **Implementation Status:** COMPLETE
- **Functionality:**
  - Creates new organizations
  - Auto-generates slug from name
  - Includes optional description
  - Form validation for name and slug
  - Toast notifications
- **Scope:** Organization level
- **Export:** `CreateOrganizationDialog()`

### 2. Create Team Dialog
**File:** `/apps/web/carcosa/components/dashboard/create-team-dialog.tsx`
- **Operation:** CREATE
- **Implementation Status:** COMPLETE
- **Functionality:**
  - Creates new teams within organizations
  - Requires organizationId and organizationName props
  - Auto-generates slug from team name
  - Optional description
  - Form validation
- **Scope:** Team level (scoped to organization)
- **Export:** `CreateTeamDialog({ organizationId, organizationName })`

### 3. Create Project Dialog
**File:** `/apps/web/carcosa/components/dashboard/create-project-dialog.tsx`
- **Operation:** CREATE
- **Implementation Status:** COMPLETE
- **Functionality:**
  - Creates projects with multi-tenant support option
  - Bucket selection (loads connected buckets)
  - Optional team assignment
  - Auto-generates slug from project name
  - Multi-tenant toggle switch
  - Shows selected bucket and team preview
  - Validates all required fields
- **Scope:** Project level
- **Export:** `CreateProjectDialog({ open, onOpenChange, onSuccess })`

### 4. Create App Dialog
**File:** `/apps/web/carcosa/components/dashboard/create-app-dialog.tsx`
- **Operation:** CREATE
- **Implementation Status:** COMPLETE
- **Functionality:**
  - Similar to create-project-dialog
  - Creates apps/projects with bucket selection
  - Shows bucket status and details
  - Validates required fields
- **Scope:** Project/App level
- **Export:** `CreateAppDialog({ open, onOpenChange, onSuccess })`
- **Note:** Appears to be a variant/duplicate of create-project-dialog

### 5. Create Bucket Dialog
**File:** `/apps/web/carcosa/components/dashboard/create-bucket-dialog.tsx`
- **Operation:** CREATE
- **Implementation Status:** COMPLETE
- **Functionality:**
  - Connects S3-compatible storage buckets (S3, R2)
  - Collects bucket credentials (access key, secret key)
  - Provider-specific configuration (e.g., endpoint for R2)
  - Team ownership model (bucket owned by team)
  - Shows secret key toggle visibility
  - Comprehensive form validation
- **Scope:** Bucket level
- **Export:** `CreateBucketDialog({ open, onOpenChange, onSuccess })`

### 6. Invite User Dialog
**File:** `/apps/web/carcosa/components/dashboard/invite-user-dialog.tsx`
- **Operation:** CREATE (invitations)
- **Implementation Status:** COMPLETE
- **Functionality:**
  - Invites users to organizations or teams
  - Flexible role assignment (OWNER, ADMIN, MEMBER, VIEWER)
  - Supports both organization and team level invitations
  - Dynamic title/description based on context
  - Email validation
  - Role descriptions shown in UI
- **Scope:** Membership (organization or team level)
- **Export:** `InviteUserDialog({ organizationId?, teamId?, organizationName?, teamName? })`

### 7. Bucket Sharing Dialog
**File:** `/apps/web/carcosa/components/dashboard/bucket-sharing-dialog.tsx`
- **Operation:** UPDATE (manage access), DELETE (revoke access)
- **Implementation Status:** COMPLETE
- **Functionality:**
  - Manage bucket access across teams
  - Shows bucket owner team
  - Lists teams with access
  - Three access levels: READ_ONLY, READ_WRITE, ADMIN
  - Grant new team access
  - Revoke team access with confirmation
  - Visual access level indicators with icons
  - Loads available teams dynamically
- **Scope:** Bucket sharing and permissions
- **Export:** `BucketSharingDialog({ bucket, open, onOpenChange, onUpdate })`

---

## EXISTING INLINE DIALOGS / UNEXTRACTED DIALOGS

These are dialogs embedded within components (not separate dialog components):

### 8. Tenant Management Dialogs (In app-tenants.tsx)
**File:** `/apps/web/carcosa/components/dashboard/app-tenants.tsx`
- **Operations:** CREATE, UPDATE, DELETE
- **Implementation Status:** COMPLETE (inline)
- **Functionality:**
  - Create tenant dialog with slug, name, description
  - Edit tenant dialog (slug immutable)
  - Delete tenant with confirmation
  - Tenant cards with edit/delete buttons
- **Issue:** Dialogs are embedded in component, not exported separately
- **Recommendation:** Extract to separate `edit-tenant-dialog.tsx` and `delete-tenant-dialog.tsx`

### 9. API Key Management Dialogs (In app-api-keys.tsx)
**File:** `/apps/web/carcosa/components/dashboard/app-api-keys.tsx`
- **Operations:** CREATE, REGENERATE, REVOKE
- **Implementation Status:** COMPLETE (inline)
- **Functionality:**
  - Create API key dialog with label and permissions
  - Revoke API key dialog
  - Regenerate API key dialog
  - Show newly created key modal with copy functionality
  - Key visibility toggle
- **Issue:** Dialogs embedded in component
- **Recommendation:** Extract to separate dialog components

### 10. App Settings Delete Dialog (In app-settings.tsx)
**File:** `/apps/web/carcosa/components/dashboard/app-settings.tsx`
- **Operations:** DELETE
- **Implementation Status:** INCOMPLETE (stub)
- **Functionality:**
  - Delete application confirmation inline
  - Two-step confirmation (button + confirmation box)
  - Shows danger zone warning
- **Issues:**
  - No actual deletion API call (TODO comment)
  - Not a separate dialog component
  - Confirmation is inline UI, not modal dialog

---

## MISSING DIALOG COMPONENTS FOR COMPLETE CRUD

### Critical Missing Dialogs

#### 1. Edit Organization Dialog
- **Operation:** UPDATE
- **Priority:** HIGH
- **Use Cases:**
  - Change organization name
  - Update slug
  - Update description
  - Change logo/branding
- **Similar To:** create-organization-dialog
- **Data Model:** `Organization { id, name, slug, description, logo, ... }`

#### 2. Delete Organization Dialog
- **Operation:** DELETE
- **Priority:** HIGH
- **Use Cases:**
  - Permanently delete organization and all associated data
  - Confirmation dialog with warnings
  - List impact (teams, projects, buckets being deleted)
- **Notes:** Destructive operation - needs clear warnings and multi-step confirmation

#### 3. Edit Team Dialog
- **Operation:** UPDATE
- **Priority:** HIGH
- **Use Cases:**
  - Change team name
  - Update slug
  - Update description
- **Similar To:** create-team-dialog
- **Data Model:** `Team { id, name, slug, description, ... }`

#### 4. Delete Team Dialog
- **Operation:** DELETE
- **Priority:** HIGH
- **Use Cases:**
  - Delete team and reassign/delete projects
  - Confirmation with impact warnings
- **Notes:** Needs to handle cascade deletion impact

#### 5. Edit Member Role Dialog
- **Operation:** UPDATE
- **Priority:** HIGH
- **Use Cases:**
  - Change team member role (OWNER → ADMIN → MEMBER → VIEWER)
  - Change organization member role
  - Visual confirmation of permission changes
- **Data Model:** `TeamMember { teamId, userId, role }` or `OrganizationMember { organizationId, userId, role }`

#### 6. Remove Member Dialog
- **Operation:** DELETE
- **Priority:** HIGH
- **Use Cases:**
  - Remove team member
  - Remove organization member
  - Two-step confirmation
- **Notes:** Consider cascading effects (projects owned by member, etc.)

#### 7. Edit Project Dialog
- **Operation:** UPDATE
- **Priority:** MEDIUM
- **Use Cases:**
  - Change project name
  - Change project slug
  - Change assigned bucket
  - Update multi-tenant setting
- **Similar To:** create-project-dialog

#### 8. Delete Project Dialog
- **Operation:** DELETE
- **Priority:** MEDIUM
- **Use Cases:**
  - Delete project configuration
  - Confirm files in bucket remain untouched
- **Notes:** Data remains in bucket, only project metadata deleted

#### 9. Edit Bucket Dialog
- **Operation:** UPDATE
- **Priority:** MEDIUM
- **Use Cases:**
  - Update display name
  - Rotate credentials
  - Change endpoint configuration
  - Update region
- **Data Model:** `Bucket { id, name, provider, region, endpoint, ... }`

#### 10. Delete Bucket Dialog
- **Operation:** DELETE
- **Priority:** MEDIUM
- **Use Cases:**
  - Disconnect bucket
  - Shows warning about projects using this bucket
  - Handles sharing with other teams
- **Notes:** Check projects using bucket before deletion

#### 11. Revoke Invitation Dialog
- **Operation:** DELETE
- **Priority:** LOW
- **Use Cases:**
  - Cancel pending invitation
  - Confirmation dialog

#### 12. Edit API Key Dialog
- **Operation:** UPDATE
- **Priority:** LOW
- **Use Cases:**
  - Change API key label
  - Update permissions
- **Note:** Usually API keys are immutable; only label/permissions might be editable

---

## ENTITY RELATIONSHIP HIERARCHY & CRUD COVERAGE

```
Organization (owner: User)
├── Teams (owned by org) ← CREATE ✓ | EDIT ✗ | DELETE ✗ | READ ✓
│   ├── Team Members ← INVITE ✓ | EDIT ROLE ✗ | REMOVE ✗ | READ ✓
│   └── Projects ← CREATE ✓ | EDIT ✗ | DELETE ✗ | READ ✓
│       ├── API Keys ← CREATE ✓ | REGEN ✓ | REVOKE ✓ | READ ✓
│       ├── Tenants ← CREATE ✓ | EDIT ✓ | DELETE ✓ | READ ✓
│       └── Files ← READ ✓ | DELETE ✓ (inline in app-files)
├── Buckets (owned by team, shared with teams) ← CREATE ✓ | EDIT ✗ | DELETE ✗ | READ ✓
│   └── Sharing Permissions ← GRANT ✓ | REVOKE ✓ | READ ✓
└── Organization Members ← INVITE ✓ | EDIT ROLE ✗ | REMOVE ✗ | READ ✓

Legend: ✓ = Has dialog/implementation | ✗ = Missing | (parentheses) = Alternate patterns
```

---

## IMPLEMENTATION PATTERNS OBSERVED

### Successful Patterns (CREATE dialogs)
- Use `open` and `onOpenChange` props for dialog state management
- `onSuccess` callback for parent component refresh
- Form reset on successful submission
- Toast notifications for user feedback
- Field validation before submission
- Auto-slug generation from name
- Proper disabled states during submission
- Dialog triggers as children (button or custom)

### Missing Pattern Implementations
- **Edit dialogs:** Should load current data and pre-fill form
- **Delete dialogs:** Should show confirmation + impact warnings
- **Role change dialogs:** Should show current/new role comparison
- **Extracted dialogs:** Many complex dialogs still inline in components

---

## RECOMMENDATIONS

### Priority 1: Extract Existing Inline Dialogs (Quick Wins)
1. Extract tenant dialogs from `app-tenants.tsx` → `edit-tenant-dialog.tsx` (already mostly done, just needs extraction)
2. Extract API key dialogs from `app-api-keys.tsx` → separate dialog files
3. Extract delete confirmation from `app-settings.tsx` → `delete-project-dialog.tsx`

### Priority 2: Create Core CRUD Dialogs
1. `edit-organization-dialog.tsx`
2. `delete-organization-dialog.tsx`
3. `edit-team-dialog.tsx`
4. `delete-team-dialog.tsx`
5. `edit-member-role-dialog.tsx`
6. `remove-member-dialog.tsx`

### Priority 3: Create Secondary CRUD Dialogs
1. `edit-project-dialog.tsx`
2. `delete-project-dialog.tsx`
3. `edit-bucket-dialog.tsx`
4. `delete-bucket-dialog.tsx`

### Priority 4: Create Utility Dialogs
1. `revoke-invitation-dialog.tsx`
2. `edit-api-key-dialog.tsx` (if needed)

---

## CHECKLIST FOR NEW DIALOGS

When creating new dialog components, ensure:
- [ ] Separate file in `components/dashboard/`
- [ ] Named pattern: `{action}-{entity}-dialog.tsx`
- [ ] Export default or named export function
- [ ] Accept `open`, `onOpenChange`, `onSuccess` props
- [ ] Handle loading/disabled states during submission
- [ ] Toast notifications (success + error)
- [ ] Form validation
- [ ] Reset form on success
- [ ] Cancel button that closes dialog
- [ ] Proper TypeScript typing
- [ ] Confirmation text for delete operations
- [ ] Impact warnings (e.g., "will delete X associated records")
- [ ] Consistent styling with existing dialogs
- [ ] Proper accessibility (labels, ARIA attributes)

---

## FILES ANALYZED

- `/apps/web/carcosa/components/dashboard/create-organization-dialog.tsx` (141 lines)
- `/apps/web/carcosa/components/dashboard/create-team-dialog.tsx` (142 lines)
- `/apps/web/carcosa/components/dashboard/create-app-dialog.tsx` (278 lines)
- `/apps/web/carcosa/components/dashboard/create-project-dialog.tsx` (362 lines)
- `/apps/web/carcosa/components/dashboard/create-bucket-dialog.tsx` (257 lines)
- `/apps/web/carcosa/components/dashboard/invite-user-dialog.tsx` (184 lines)
- `/apps/web/carcosa/components/dashboard/bucket-sharing-dialog.tsx` (330 lines)
- `/apps/web/carcosa/components/dashboard/app-tenants.tsx` (380+ lines, inline dialogs)
- `/apps/web/carcosa/components/dashboard/app-api-keys.tsx` (500+ lines, inline dialogs)
- `/apps/web/carcosa/components/dashboard/app-settings.tsx` (213 lines, inline delete)
- `/apps/web/carcosa/components/dashboard/bucket-grid.tsx` (200+ lines, inline delete)
- `/apps/web/carcosa/components/dashboard/app-grid.tsx` (158 lines)

**Total:** 12 component files analyzed, 7 dedicated dialog components found, 3+ inline dialogs found

