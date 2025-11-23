# Carcosa Frontend Completion Roadmap

**Status**: 🚧 In Progress
**Last Updated**: November 14, 2025
**Current Completion**: ~40% (7 of 20 core CRUD operations)

---

## Table of Contents

1. [Overview](#overview)
2. [User Hierarchy Model Analysis](#user-hierarchy-model-analysis)
3. [Complete UI Components Inventory](#complete-ui-components-inventory)
4. [Missing Backend APIs](#missing-backend-apis)
5. [Frontend Implementation Plan](#frontend-implementation-plan)
6. [Page-by-Page Breakdown](#page-by-page-breakdown)
7. [Component Priority Matrix](#component-priority-matrix)

---

## Overview

This document provides a comprehensive breakdown of ALL frontend UI components, dialogs, and pages needed to complete Carcosa's dashboard. It maps each UI element to its backend API endpoint and identifies gaps in both frontend and backend implementation.

### Current State Summary

**Backend API Coverage** (from CRUD_ANALYSIS.md):
- ✅ **Full CRUD**: Projects, Tenants, API Keys
- 🟨 **Partial CRUD**: Organizations (CR only), Teams (CR only), Buckets (CRD only), Files (RD only)
- ❌ **No Management**: Team Members, Organization Members, Versions, User Profile

**Frontend UI Coverage** (from DIALOG_COMPONENTS analysis):
- ✅ **Complete Dialogs**: 7 (Create Org, Create Team, Create Project, Create Bucket, Invite User, Bucket Sharing, Create App)
- 🟨 **Inline Dialogs**: 3 (Tenant CRUD, API Key CRUD, Delete Project stub)
- ❌ **Missing Dialogs**: 12+ (All edit/delete operations for orgs/teams/members)

---

## User Hierarchy Model Analysis

### Current Model (Carcosa)

```
User
├── Organizations (can own/be member of multiple)
│   ├── Organization Members (roles: OWNER, ADMIN, MEMBER, VIEWER)
│   └── Teams (multiple per org)
│       ├── Team Members (roles: OWNER, ADMIN, MEMBER, VIEWER)
│       ├── Buckets (owned by team, shareable)
│       └── Projects (belong to team)
│           ├── Files
│           ├── Tenants (multi-tenancy isolation)
│           ├── Transforms
│           ├── API Keys
│           └── Usage Analytics
```

### Industry Comparison

| Platform | Hierarchy | Notes |
|----------|-----------|-------|
| **GitHub** | User → Orgs → Teams → Repos | Industry standard, personal + org accounts |
| **Vercel** | User → Teams → Projects | Simplified 2-tier, "Personal Team" for solo users |
| **Linear** | User → Workspaces → Teams → Projects | Workspace = org, teams are groups |
| **Carcosa** | User → Orgs → Teams → Projects | **Similar to GitHub** |

### Issues with Current Model

#### ❌ Problems

1. **No "Personal Workspace" UX**
   - Forces solo developers to create "organization" (confusing)
   - Auto-creates "Default Team" (unnecessary for solo users)
   - Terminology doesn't match solo developer mental model

2. **Mandatory Team Hierarchy**
   - Projects MUST belong to teams
   - Buckets MUST be owned by teams
   - Solo users get stuck with "Default Team" concept

3. **Role Confusion**
   - Two role systems: OrganizationRole + TeamRole
   - Unclear when to use org-level vs team-level permissions
   - No UI to manage member roles (UPDATE endpoints missing)

4. **No Workspace Switching UX**
   - Users can be in multiple orgs but no clear workspace switcher
   - Current team context is hidden in provider
   - No visual indicator of current workspace

#### ✅ Strengths

1. **Solid Data Model** - Database schema is well-designed
2. **Auto-Initialization** - Creates default org/team on registration
3. **Team Sharing** - Buckets can be shared across teams (good for collaboration)
4. **Granular Permissions** - Role-based access at multiple levels

### Recommendations

#### Backend Changes Needed

1. **Add Workspace Concept** (UX layer, no schema change)
   - Map "Personal Workspace" to user's first organization
   - Auto-name first org as "{UserName}'s Workspace"
   - Allow renaming to "organization" when adding members

2. **Simplify Default Setup**
   - ✅ Already done: Auto-creates org on registration
   - 🔄 Improve: Better naming ("Personal Workspace" vs "Default Team")
   - 🔄 Add: UI hint explaining hierarchy

3. **Add Missing Member Management APIs**
   - `PATCH /organizations/:id` - Update org name/description
   - `DELETE /organizations/:id` - Delete organization
   - `PATCH /teams/:id` - Update team name/description
   - `DELETE /teams/:id` - Delete team
   - `GET /teams/:teamId/members` - List team members
   - `PATCH /teams/:teamId/members/:memberId` - Update member role
   - `DELETE /teams/:teamId/members/:memberId` - Remove member
   - `GET /organizations/:orgId/members` - List org members
   - `PATCH /organizations/:orgId/members/:memberId` - Update org member role
   - `DELETE /organizations/:orgId/members/:memberId` - Remove org member

4. **Add User Profile APIs**
   - `PATCH /auth/profile` - Update name/email
   - `POST /auth/change-password` - Change password
   - `POST /auth/forgot-password` - Request reset
   - `POST /auth/reset-password` - Complete reset

#### Frontend Changes Needed

1. **Workspace Switcher** (Header/Sidebar)
   - Dropdown showing all organizations user is member of
   - "Personal Workspace" label for single-member orgs
   - Visual indicator of current workspace
   - Team switcher within workspace

2. **Better Onboarding**
   - Explain hierarchy on first login
   - Show "Your Personal Workspace" instead of org jargon
   - Guide users to invite team members

3. **Settings Pages** (Missing entirely)
   - `/dashboard/organizations/:id/settings` - Edit org settings
   - `/dashboard/teams/:id/settings` - Edit team settings
   - `/dashboard/account` - User profile settings

---

## Complete UI Components Inventory

### ✅ Existing Complete Dialogs (7)

Located in `apps/web/carcosa/components/dashboard/`:

1. **create-organization-dialog.tsx** ✅
   - **Purpose**: Create new organization
   - **API**: `POST /organizations`
   - **Status**: Production-ready
   - **Location**: Used in `/dashboard/organizations/page.tsx`

2. **create-team-dialog.tsx** ✅
   - **Purpose**: Create team within organization
   - **API**: `POST /organizations/:organizationId/teams`
   - **Status**: Production-ready
   - **Location**: Used in `/dashboard/organizations/page.tsx`

3. **create-project-dialog.tsx** ✅
   - **Purpose**: Create new project
   - **API**: `POST /projects`
   - **Status**: Production-ready
   - **Location**: Multiple pages

4. **create-app-dialog.tsx** ✅
   - **Purpose**: Create new project (alternative UI)
   - **API**: `POST /projects`
   - **Status**: Production-ready, duplicate of create-project

5. **create-bucket-dialog.tsx** ✅
   - **Purpose**: Create storage bucket
   - **API**: `POST /buckets?teamId=X`
   - **Status**: Production-ready
   - **Location**: `/dashboard/buckets/page.tsx`

6. **invite-user-dialog.tsx** ✅
   - **Purpose**: Invite user to org or team
   - **API**: `POST /organizations/invite`
   - **Status**: Production-ready
   - **Location**: `/dashboard/organizations/page.tsx`

7. **bucket-sharing-dialog.tsx** ✅
   - **Purpose**: Share bucket with teams
   - **API**: `POST /buckets/:bucketId/share`
   - **Status**: Production-ready
   - **Location**: `/dashboard/buckets/page.tsx`

### 🟨 Inline Dialogs (3) - Need Extraction

Located directly in page files:

1. **Tenant Create/Edit/Delete Dialogs** 🟨
   - **Location**: `apps/web/carcosa/components/dashboard/app-tenants.tsx:215-350`
   - **APIs**:
     - `POST /projects/:id/tenants`
     - `PATCH /projects/:id/tenants/:tenantId`
     - `DELETE /projects/:id/tenants/:tenantId`
   - **Status**: Complete but needs extraction to separate files
   - **Action Required**: Extract to:
     - `create-tenant-dialog.tsx`
     - `edit-tenant-dialog.tsx`
     - `delete-tenant-dialog.tsx`

2. **API Key Create/Regenerate/Delete Dialogs** 🟨
   - **Location**: `apps/web/carcosa/components/dashboard/app-api-keys.tsx:180-320`
   - **APIs**:
     - `POST /projects/:id/api-keys`
     - `POST /projects/:id/api-keys/:keyId/regenerate`
     - `DELETE /projects/:id/api-keys/:keyId`
   - **Status**: Complete but needs extraction
   - **Action Required**: Extract to:
     - `create-api-key-dialog.tsx`
     - `regenerate-api-key-dialog.tsx`
     - `delete-api-key-dialog.tsx`

3. **Delete Project Dialog** 🟨
   - **Location**: `apps/web/carcosa/components/dashboard/app-settings.tsx:45-80`
   - **API**: `DELETE /projects/:id`
   - **Status**: Stub implementation (confirmation dialog only)
   - **Action Required**: Complete implementation with error handling

### ❌ Missing Dialogs (Critical - Need Creation)

#### Organization Management (6 dialogs)

1. **edit-organization-dialog.tsx** ❌
   - **Purpose**: Edit organization name, slug, description, logo
   - **API**: `PATCH /organizations/:id` ⚠️ **MISSING API**
   - **Required Fields**: name, slug, description?, logo?
   - **Permissions**: OWNER or ADMIN only
   - **Location**: `/dashboard/organizations/page.tsx`, `/dashboard/organizations/:id/settings`

2. **delete-organization-dialog.tsx** ❌
   - **Purpose**: Delete organization with confirmation
   - **API**: `DELETE /organizations/:id` ⚠️ **MISSING API**
   - **Warnings**:
     - Shows count of teams, projects, members to be deleted
     - Requires typing org slug to confirm
     - Cascading delete warning
   - **Permissions**: OWNER only
   - **Location**: `/dashboard/organizations/:id/settings`

3. **organization-settings-page.tsx** ❌
   - **Purpose**: Full settings page for organization
   - **Sections**:
     - General settings (name, slug, description, logo)
     - Members list with role management
     - Danger zone (delete org)
   - **Location**: `/dashboard/organizations/:id/settings` (NEW PAGE)

4. **edit-organization-member-dialog.tsx** ❌
   - **Purpose**: Change member role (OWNER/ADMIN/MEMBER/VIEWER)
   - **API**: `PATCH /organizations/:orgId/members/:memberId` ⚠️ **MISSING API**
   - **Permissions**: OWNER or ADMIN
   - **Location**: Organization settings page

5. **remove-organization-member-dialog.tsx** ❌
   - **Purpose**: Remove member from organization
   - **API**: `DELETE /organizations/:orgId/members/:memberId` ⚠️ **MISSING API**
   - **Warnings**: Cannot remove organization owner
   - **Permissions**: OWNER or ADMIN
   - **Location**: Organization settings page

6. **leave-organization-dialog.tsx** ❌
   - **Purpose**: Leave organization (for non-owners)
   - **API**: `DELETE /organizations/:orgId/members/:memberId`
   - **Warnings**: Cannot leave if you're the owner
   - **Location**: Organization settings page

#### Team Management (6 dialogs)

7. **edit-team-dialog.tsx** ❌
   - **Purpose**: Edit team name, slug, description
   - **API**: `PATCH /teams/:id` ⚠️ **MISSING API**
   - **Required Fields**: name, slug, description?
   - **Permissions**: Team OWNER or ADMIN
   - **Location**: `/dashboard/teams/page.tsx`, `/dashboard/team/:id/settings`

8. **delete-team-dialog.tsx** ❌
   - **Purpose**: Delete team with confirmation
   - **API**: `DELETE /teams/:id` ⚠️ **MISSING API**
   - **Warnings**:
     - Shows count of projects, buckets, members
     - Requires typing team slug to confirm
     - Cannot delete if team owns buckets in use
   - **Permissions**: Team OWNER only
   - **Location**: `/dashboard/team/:id/settings`

9. **team-settings-page.tsx** ❌
   - **Purpose**: Full settings page for team
   - **Sections**:
     - General settings (name, slug, description)
     - Members list with role management
     - Buckets owned by team
     - Danger zone (delete team)
   - **Location**: `/dashboard/team/:id/settings` (NEW PAGE)

10. **edit-team-member-dialog.tsx** ❌
    - **Purpose**: Change team member role
    - **API**: `PATCH /teams/:teamId/members/:memberId` ⚠️ **MISSING API**
    - **Permissions**: Team OWNER or ADMIN
    - **Location**: Team settings page

11. **remove-team-member-dialog.tsx** ❌
    - **Purpose**: Remove member from team
    - **API**: `DELETE /teams/:teamId/members/:memberId` ⚠️ **MISSING API**
    - **Warnings**: Cannot remove team owner
    - **Permissions**: Team OWNER or ADMIN
    - **Location**: Team settings page

12. **leave-team-dialog.tsx** ❌
    - **Purpose**: Leave team (for non-owners)
    - **API**: `DELETE /teams/:teamId/members/:memberId`
    - **Warnings**: Cannot leave if you're the owner or last member
    - **Location**: Team settings page

#### Project Management (3 dialogs)

13. **edit-project-dialog.tsx** ❌
    - **Purpose**: Edit project name, slug, bucket
    - **API**: `PATCH /projects/:id` ✅ **EXISTS**
    - **Status**: Backend ready, need frontend dialog
    - **Location**: `/dashboard/app/:id/settings`

14. **delete-project-dialog.tsx** 🟨
    - **Purpose**: Delete project (currently stub)
    - **API**: `DELETE /projects/:id` ✅ **EXISTS**
    - **Status**: Needs proper implementation with file cleanup warning
    - **Action**: Complete the stub in app-settings.tsx

15. **transfer-project-dialog.tsx** ❌
    - **Purpose**: Transfer project to different team
    - **API**: `PATCH /projects/:id/team` ⚠️ **MISSING API**
    - **Permissions**: Project owner or team admin
    - **Location**: `/dashboard/app/:id/settings`

#### Bucket Management (2 dialogs)

16. **edit-bucket-dialog.tsx** ❌
    - **Purpose**: Edit bucket name, credentials
    - **API**: `PATCH /buckets/:id` ⚠️ **MISSING API**
    - **Warnings**: Changing credentials affects all projects
    - **Permissions**: Bucket owner team admin
    - **Location**: `/dashboard/buckets/:id/page.tsx`

17. **delete-bucket-dialog.tsx** ❌
    - **Purpose**: Delete bucket (enhanced)
    - **API**: `DELETE /buckets/:id` ✅ **EXISTS**
    - **Status**: Backend exists, need proper frontend dialog
    - **Warnings**: Cannot delete if in use by projects
    - **Location**: `/dashboard/buckets/:id/page.tsx`

#### Invitation Management (3 dialogs)

18. **revoke-invitation-dialog.tsx** ❌
    - **Purpose**: Cancel pending invitation
    - **API**: `DELETE /organizations/invitations/:id` ⚠️ **MISSING API**
    - **Permissions**: Inviter or org/team admin
    - **Location**: `/dashboard/organizations/page.tsx`

19. **accept-invitation-banner.tsx** ❌
    - **Purpose**: Accept pending invitations (banner at top of dashboard)
    - **API**: `POST /organizations/invitations/:invitationId/accept` ✅ **EXISTS**
    - **Status**: Backend ready, need UI
    - **Location**: `/dashboard` (persistent banner)

20. **decline-invitation-dialog.tsx** ❌
    - **Purpose**: Decline invitation
    - **API**: `POST /organizations/invitations/:invitationId/decline` ⚠️ **MISSING API**
    - **Location**: Accept invitation banner

#### User Profile (3 dialogs)

21. **edit-profile-dialog.tsx** ❌
    - **Purpose**: Edit user name, email
    - **API**: `PATCH /auth/profile` ⚠️ **MISSING API**
    - **Location**: `/dashboard/account/page.tsx`

22. **change-password-dialog.tsx** ❌
    - **Purpose**: Change password
    - **API**: `POST /auth/change-password` ⚠️ **MISSING API**
    - **Required**: Old password, new password, confirm
    - **Location**: `/dashboard/account/page.tsx`

23. **forgot-password-page.tsx** ❌
    - **Purpose**: Password reset flow
    - **APIs**:
      - `POST /auth/forgot-password` ⚠️ **MISSING API**
      - `POST /auth/reset-password` ⚠️ **MISSING API**
    - **Location**: `/auth/forgot-password` (NEW PAGE)

---

## Missing Backend APIs

These APIs MUST be implemented before frontend dialogs can be completed:

### Tier 1 - Critical (Blocks Core Features)

1. **Organizations**
   - `PATCH /organizations/:id` - Update org
   - `DELETE /organizations/:id` - Delete org
   - `GET /organizations/:id/members` - List members
   - `PATCH /organizations/:id/members/:memberId` - Update member role
   - `DELETE /organizations/:id/members/:memberId` - Remove member

2. **Teams**
   - `PATCH /teams/:id` - Update team
   - `DELETE /teams/:id` - Delete team
   - `GET /teams/:id/members` - List team members
   - `PATCH /teams/:id/members/:memberId` - Update team member role
   - `DELETE /teams/:id/members/:memberId` - Remove team member

3. **User Profile**
   - `PATCH /auth/profile` - Update name/email
   - `POST /auth/change-password` - Change password
   - `POST /auth/forgot-password` - Request reset
   - `POST /auth/reset-password` - Complete reset

4. **Invitations**
   - `DELETE /organizations/invitations/:id` - Revoke invitation
   - `POST /organizations/invitations/:id/decline` - Decline invitation
   - `POST /organizations/invitations/:id/resend` - Resend invitation email

### Tier 2 - Important (Enhances Functionality)

5. **Buckets**
   - `PATCH /buckets/:id` - Update bucket config
   - `POST /buckets/:id/rotate-credentials` - Rotate access keys
   - `GET /buckets/:id/usage` - Bucket storage usage

6. **Files**
   - `PATCH /projects/:id/files/:fileId` - Update file metadata
   - `POST /projects/:id/files/:fileId/rename` - Rename file

7. **Projects**
   - `PATCH /projects/:id/team` - Transfer project to different team
   - `POST /projects/:id/archive` - Archive project
   - `POST /projects/:id/restore` - Restore archived project

### Tier 3 - Enhancement (Nice to Have)

8. **Versions**
   - Full CRUD for file versioning system (no endpoints exist)

9. **Settings**
   - Actually persist settings (currently returns hardcoded defaults)

---

## Frontend Implementation Plan

### Sprint 1: Core Member Management (Week 3, Days 1-3)

**Goal**: Users can manage organization and team members

#### Tasks

1. **Backend APIs** (3-4 hours)
   - Implement organization member CRUD endpoints (5 endpoints)
   - Implement team member CRUD endpoints (5 endpoints)
   - Add permission checks (OWNER/ADMIN only)

2. **Frontend Dialogs** (4-5 hours)
   - Create `edit-organization-member-dialog.tsx`
   - Create `remove-organization-member-dialog.tsx`
   - Create `edit-team-member-dialog.tsx`
   - Create `remove-team-member-dialog.tsx`
   - Create `leave-organization-dialog.tsx`
   - Create `leave-team-dialog.tsx`

3. **Settings Pages** (3-4 hours)
   - Create `/dashboard/organizations/:id/settings/page.tsx`
   - Create `/dashboard/team/:id/settings/page.tsx`
   - Add members list with inline role editing
   - Add remove/leave actions

4. **Testing** (2 hours)
   - Test member role changes
   - Test member removal
   - Test leave organization/team
   - Test permission enforcement

**Deliverable**: Users can manage members in orgs and teams ✅

---

### Sprint 2: Organization & Team Settings (Week 3, Days 4-5)

**Goal**: Users can edit and delete organizations and teams

#### Tasks

1. **Backend APIs** (2-3 hours)
   - Implement `PATCH /organizations/:id`
   - Implement `DELETE /organizations/:id` with cascading checks
   - Implement `PATCH /teams/:id`
   - Implement `DELETE /teams/:id` with bucket validation

2. **Frontend Dialogs** (3-4 hours)
   - Create `edit-organization-dialog.tsx`
   - Create `delete-organization-dialog.tsx`
   - Create `edit-team-dialog.tsx`
   - Create `delete-team-dialog.tsx`

3. **Settings Pages Enhancement** (2 hours)
   - Add general settings section to org settings
   - Add general settings section to team settings
   - Add danger zone sections
   - Add slug validation with debouncing

4. **Testing** (2 hours)
   - Test org rename with slug conflicts
   - Test team deletion with bucket conflicts
   - Test cascading deletions
   - Test confirmation flows

**Deliverable**: Full CRUD for organizations and teams ✅

---

### Sprint 3: User Profile & Auth (Week 3, Days 6-7)

**Goal**: Users can manage their profiles and passwords

#### Tasks

1. **Backend APIs** (4-5 hours)
   - Implement `PATCH /auth/profile`
   - Implement `POST /auth/change-password`
   - Implement `POST /auth/forgot-password` with email
   - Implement `POST /auth/reset-password`
   - Add email verification flow (optional)

2. **Frontend Dialogs** (3-4 hours)
   - Create `edit-profile-dialog.tsx`
   - Create `change-password-dialog.tsx`
   - Create `/auth/forgot-password/page.tsx`
   - Create `/auth/reset-password/page.tsx`

3. **Account Settings Page** (2 hours)
   - Enhance `/dashboard/account/page.tsx`
   - Add profile section
   - Add security section (password change)
   - Add email verification status

4. **Testing** (2 hours)
   - Test profile updates
   - Test password change
   - Test forgot password flow
   - Test email validation

**Deliverable**: Full user account management ✅

---

### Sprint 4: Project & Bucket Enhancements (Week 4, Days 1-2)

**Goal**: Complete project and bucket management

#### Tasks

1. **Backend APIs** (2-3 hours)
   - Implement `PATCH /buckets/:id`
   - Implement `PATCH /projects/:id/team` (transfer project)

2. **Frontend Dialogs** (3-4 hours)
   - Create `edit-project-dialog.tsx`
   - Complete `delete-project-dialog.tsx` (currently stub)
   - Create `transfer-project-dialog.tsx`
   - Create `edit-bucket-dialog.tsx`
   - Create `delete-bucket-dialog.tsx`

3. **Project Settings Enhancement** (2 hours)
   - Add edit project button to settings
   - Add transfer project section
   - Enhance delete confirmation

4. **Bucket Settings Page** (2 hours)
   - Create `/dashboard/buckets/:id/page.tsx`
   - Add edit bucket form
   - Add sharing management
   - Add delete button

5. **Testing** (2 hours)
   - Test project editing
   - Test project transfer
   - Test bucket editing
   - Test deletion validations

**Deliverable**: Full project and bucket management ✅

---

### Sprint 5: Invitation Management (Week 4, Days 3-4)

**Goal**: Complete invitation lifecycle

#### Tasks

1. **Backend APIs** (2 hours)
   - Implement `DELETE /organizations/invitations/:id` (revoke)
   - Implement `POST /organizations/invitations/:id/decline`
   - Implement `POST /organizations/invitations/:id/resend`

2. **Frontend Components** (3-4 hours)
   - Create `revoke-invitation-dialog.tsx`
   - Create `decline-invitation-dialog.tsx`
   - Create `accept-invitation-banner.tsx`
   - Add resend button to invitations list

3. **Dashboard Enhancement** (2 hours)
   - Add persistent invitation banner at top of dashboard
   - Show pending invitation count in header
   - Add dismiss invitation action

4. **Organizations Page Enhancement** (2 hours)
   - Add revoke button to pending invitations
   - Add resend button with cooldown timer
   - Add invitation status badges

5. **Testing** (1-2 hours)
   - Test accept invitation flow
   - Test decline invitation
   - Test revoke invitation
   - Test resend with rate limiting

**Deliverable**: Full invitation management ✅

---

### Sprint 6: Component Extraction & Cleanup (Week 4, Day 5)

**Goal**: Extract inline dialogs and standardize components

#### Tasks

1. **Extract Tenant Dialogs** (2 hours)
   - Extract from `app-tenants.tsx:215-350`
   - Create `create-tenant-dialog.tsx`
   - Create `edit-tenant-dialog.tsx`
   - Create `delete-tenant-dialog.tsx`

2. **Extract API Key Dialogs** (2 hours)
   - Extract from `app-api-keys.tsx:180-320`
   - Create `create-api-key-dialog.tsx`
   - Create `regenerate-api-key-dialog.tsx`
   - Create `delete-api-key-dialog.tsx`

3. **Component Standardization** (2 hours)
   - Create shared dialog base component
   - Standardize error handling
   - Standardize loading states
   - Add consistent toast notifications

4. **Documentation** (1 hour)
   - Update component README
   - Add Storybook stories
   - Document dialog patterns

**Deliverable**: Clean, reusable dialog components ✅

---

### Sprint 7: Polish & UX Improvements (Week 4, Days 6-7)

**Goal**: Improve user experience and add missing UI elements

#### Tasks

1. **Workspace Switcher** (3-4 hours)
   - Create workspace switcher dropdown in header
   - Show all organizations user is member of
   - Label single-member orgs as "Personal Workspace"
   - Add team switcher within workspace
   - Persist selection in localStorage

2. **Onboarding Improvements** (2-3 hours)
   - Enhance onboarding-workspace.tsx
   - Add hierarchy explanation
   - Add tooltips and help text
   - Create guided tour (optional)

3. **Settings Pages UX** (2 hours)
   - Add breadcrumbs to all settings pages
   - Add back navigation
   - Add unsaved changes warning
   - Add success/error feedback

4. **Empty States** (2 hours)
   - Improve empty states across all pages
   - Add helpful CTAs
   - Add illustrations
   - Add getting started guides

5. **Loading States** (1-2 hours)
   - Add skeleton loaders
   - Add loading spinners
   - Add optimistic updates where appropriate

6. **Testing & QA** (3-4 hours)
   - Cross-browser testing
   - Mobile responsiveness
   - Accessibility audit
   - Performance optimization

**Deliverable**: Polished, production-ready UI ✅

---

## Page-by-Page Breakdown

This section details EXACTLY what needs to be on each page and what's missing.

### 📄 `/dashboard` (Main Dashboard)

**File**: `apps/web/carcosa/app/dashboard/page.tsx`

#### ✅ What Exists
- Organization header with name
- Quick stats cards (Teams, Buckets, Projects, Current Team)
- Teams list preview (first 3 teams)
- Quick action links
- Onboarding flow for users without orgs

#### ❌ What's Missing
1. **Invitation Banner** (persistent)
   - Show pending invitations count
   - Accept/Decline actions
   - Should appear at very top when invitations exist

2. **Workspace Switcher** (Header)
   - Dropdown to switch between organizations
   - Visual indicator of current workspace
   - "Personal Workspace" label for solo users

3. **Recent Activity Feed**
   - Recent files uploaded
   - Recent transforms
   - Recent team actions

4. **Usage Summary Card**
   - Current month bandwidth
   - File count
   - Storage used

#### 🔧 Components Needed
- `accept-invitation-banner.tsx` ❌
- `workspace-switcher.tsx` ❌
- `recent-activity-card.tsx` ❌
- `usage-summary-card.tsx` ❌

---

### 📄 `/dashboard/organizations` (Organizations List)

**File**: `apps/web/carcosa/app/dashboard/organizations/page.tsx`

#### ✅ What Exists
- List of organizations user is member of
- Create organization button
- Create team button (within each org card)
- Invite user button (within each org card)
- Pending invitations list
- Organization member count
- Team count

#### ❌ What's Missing
1. **Organization Settings Link**
   - Button to go to `/dashboard/organizations/:id/settings`

2. **Organization Actions**
   - Edit organization button
   - Leave organization button (for non-owners)

3. **Invitation Actions**
   - Revoke invitation button
   - Resend invitation button
   - Accept/Decline buttons (currently placeholder)

4. **Member List Preview**
   - Show first few members in org card
   - Link to full member list

#### 🔧 Components Needed
- `edit-organization-dialog.tsx` ❌
- `leave-organization-dialog.tsx` ❌
- `revoke-invitation-dialog.tsx` ❌

#### 🔧 Actions Needed
- Wire up Accept/Decline buttons (lines 225-230)
- Add settings link to each org card

---

### 📄 `/dashboard/organizations/:id/settings` (Organization Settings)

**File**: NEW PAGE NEEDED ❌

**Route**: `apps/web/carcosa/app/dashboard/organizations/[id]/settings/page.tsx`

#### Sections Required

1. **General Settings**
   - Organization name (editable)
   - Organization slug (editable with validation)
   - Description (editable)
   - Logo upload (editable)
   - Save button

2. **Members Management**
   - Table of all organization members
   - Columns: Name, Email, Role, Joined Date, Actions
   - Actions per member:
     - Edit role button (opens edit-organization-member-dialog)
     - Remove button (opens remove-organization-member-dialog)
   - Cannot remove owner
   - Invite new member button

3. **Teams List**
   - List of teams in organization
   - Link to each team settings
   - Create team button

4. **Danger Zone**
   - Delete organization button
   - Leave organization button (if not owner)

#### 🔧 Components Needed
- Page file itself ❌
- `edit-organization-dialog.tsx` ❌ (general settings)
- `edit-organization-member-dialog.tsx` ❌
- `remove-organization-member-dialog.tsx` ❌
- `delete-organization-dialog.tsx` ❌
- `leave-organization-dialog.tsx` ❌

#### 🔧 Backend APIs Needed
- `PATCH /organizations/:id` ❌
- `DELETE /organizations/:id` ❌
- `GET /organizations/:id/members` ❌
- `PATCH /organizations/:id/members/:memberId` ❌
- `DELETE /organizations/:id/members/:memberId` ❌

---

### 📄 `/dashboard/teams` (Teams List)

**File**: `apps/web/carcosa/app/dashboard/teams/page.tsx`

#### ✅ What Exists
- Grid of teams in current organization
- Team name and description
- Member count
- Project count
- Current team indicator
- View team button
- Settings button (not wired)
- Create team section

#### ❌ What's Missing
1. **Settings Button Action**
   - Currently exists but not wired
   - Should go to `/dashboard/team/:id/settings`

2. **Team Actions Dropdown**
   - Edit team
   - Leave team
   - Delete team (owners only)

3. **Wire Create Team Button**
   - Currently just outline button
   - Should open create-team-dialog

#### 🔧 Actions Needed
- Wire settings button to settings page
- Wire create team button to dialog
- Add team actions dropdown

---

### 📄 `/dashboard/team/:id` (Team Detail)

**File**: `apps/web/carcosa/app/dashboard/team/[id]/page.tsx`

**Status**: NEW PAGE NEEDED ❌

#### Sections Required

1. **Team Header**
   - Team name
   - Team description
   - Member count
   - Settings button

2. **Projects List**
   - All projects in this team
   - Create project button
   - Project cards with quick stats

3. **Buckets Owned**
   - List of buckets owned by this team
   - Shared buckets (via BucketTeamAccess)
   - Create bucket button

4. **Team Members Preview**
   - First few members
   - Link to settings for full list

---

### 📄 `/dashboard/team/:id/settings` (Team Settings)

**File**: NEW PAGE NEEDED ❌

**Route**: `apps/web/carcosa/app/dashboard/team/[id]/settings/page.tsx`

#### Sections Required

1. **General Settings**
   - Team name (editable)
   - Team slug (editable with validation)
   - Description (editable)
   - Save button

2. **Members Management**
   - Table of team members
   - Columns: Name, Email, Role, Joined Date, Actions
   - Actions per member:
     - Edit role button (opens edit-team-member-dialog)
     - Remove button (opens remove-team-member-dialog)
   - Cannot remove team owner
   - Invite new member button

3. **Projects**
   - List of projects in team
   - Link to each project
   - Create project button

4. **Buckets**
   - Owned buckets
   - Shared buckets
   - Manage sharing button

5. **Danger Zone**
   - Delete team button (owner only)
   - Leave team button (if not owner)

#### 🔧 Components Needed
- Page file itself ❌
- `edit-team-dialog.tsx` ❌
- `edit-team-member-dialog.tsx` ❌
- `remove-team-member-dialog.tsx` ❌
- `delete-team-dialog.tsx` ❌
- `leave-team-dialog.tsx` ❌

#### 🔧 Backend APIs Needed
- `PATCH /teams/:id` ❌
- `DELETE /teams/:id` ❌
- `GET /teams/:id/members` ❌
- `PATCH /teams/:id/members/:memberId` ❌
- `DELETE /teams/:id/members/:memberId` ❌

---

### 📄 `/dashboard/apps` (Projects List)

**File**: `apps/web/carcosa/app/dashboard/apps/page.tsx`

**Status**: File exists but needs verification

#### Required Elements
- List of all projects across all teams
- Filter by team
- Search by name
- Create project button
- Project cards with:
  - Name, description
  - Team name
  - File count
  - Last activity
  - Quick actions (view, settings)

---

### 📄 `/dashboard/app/:id` (Project Detail)

**File**: `apps/web/carcosa/app/dashboard/app/[id]/page.tsx`

#### ✅ What Exists
- Project overview stats
- Quick links to files, API keys, etc.

#### ❌ What's Missing
- Edit project button (should open edit-project-dialog)
- Transfer project button (if user is admin)

#### 🔧 Components Needed
- `edit-project-dialog.tsx` ❌
- `transfer-project-dialog.tsx` ❌

---

### 📄 `/dashboard/app/:id/settings` (Project Settings)

**File**: `apps/web/carcosa/app/dashboard/app/[id]/settings/page.tsx`

#### ✅ What Exists
- Basic settings form
- Delete project button (stub)

#### ❌ What's Missing
1. **Edit Project Section**
   - Edit name, slug, bucket
   - Save button

2. **Transfer Project Section**
   - Transfer to different team dropdown
   - Transfer button

3. **Complete Delete Dialog**
   - Currently just confirmation
   - Need to show file count, usage stats
   - Require typing project slug

#### 🔧 Actions Needed
- Complete delete-project-dialog implementation
- Add edit project functionality
- Add transfer project section

---

### 📄 `/dashboard/buckets` (Buckets List)

**File**: `apps/web/carcosa/app/dashboard/buckets/page.tsx`

#### ✅ What Exists
- Grid of buckets
- Create bucket button
- Bucket sharing button

#### ❌ What's Missing
1. **Bucket Actions**
   - Edit bucket button
   - Delete bucket button
   - View bucket details link

2. **Bucket Status Indicators**
   - Connection status
   - Last checked timestamp
   - Health warning if failing

#### 🔧 Components Needed
- `edit-bucket-dialog.tsx` ❌
- `delete-bucket-dialog.tsx` ❌

---

### 📄 `/dashboard/buckets/:id` (Bucket Detail)

**File**: NEW PAGE NEEDED ❌

**Route**: `apps/web/carcosa/app/dashboard/buckets/[id]/page.tsx`

#### Sections Required

1. **Bucket Overview**
   - Bucket name
   - Provider (S3/R2)
   - Region
   - Endpoint
   - Status indicator

2. **Configuration**
   - Edit bucket button
   - Test connection button
   - Rotate credentials button

3. **Sharing**
   - Teams with access
   - Access levels (READ_ONLY, READ_WRITE, ADMIN)
   - Grant access button
   - Revoke access per team

4. **Projects Using This Bucket**
   - List of projects
   - Cannot delete if in use

5. **Danger Zone**
   - Delete bucket button

#### 🔧 Components Needed
- Page file itself ❌
- `edit-bucket-dialog.tsx` ❌
- `delete-bucket-dialog.tsx` ❌

#### 🔧 Backend APIs Needed
- `PATCH /buckets/:id` ❌
- `POST /buckets/:id/rotate-credentials` ❌

---

### 📄 `/dashboard/account` (User Profile)

**File**: `apps/web/carcosa/app/dashboard/account/page.tsx`

#### ✅ What Exists
- Basic account page (exists but minimal)

#### ❌ What's Missing
1. **Profile Section**
   - Name (editable)
   - Email (editable with verification)
   - Profile picture upload
   - Edit profile button

2. **Security Section**
   - Change password button
   - Two-factor authentication (future)
   - Active sessions list

3. **Organizations & Teams**
   - List of organizations user is member of
   - List of teams user is member of
   - Leave buttons

#### 🔧 Components Needed
- `edit-profile-dialog.tsx` ❌
- `change-password-dialog.tsx` ❌

#### 🔧 Backend APIs Needed
- `PATCH /auth/profile` ❌
- `POST /auth/change-password` ❌

---

### 📄 `/auth/forgot-password` (Password Reset)

**File**: NEW PAGE NEEDED ❌

**Route**: `apps/web/carcosa/app/auth/forgot-password/page.tsx`

#### Sections Required

1. **Request Reset**
   - Email input
   - Send reset link button
   - Back to login link

2. **Check Email Message**
   - Show after submission
   - Resend link button

#### 🔧 Backend APIs Needed
- `POST /auth/forgot-password` ❌

---

### 📄 `/auth/reset-password` (Complete Password Reset)

**File**: NEW PAGE NEEDED ❌

**Route**: `apps/web/carcosa/app/auth/reset-password/page.tsx`

#### Sections Required

1. **Reset Form**
   - Token (from URL)
   - New password input
   - Confirm password input
   - Submit button

2. **Success Message**
   - Redirect to login

#### 🔧 Backend APIs Needed
- `POST /auth/reset-password` ❌

---

## Component Priority Matrix

This matrix helps prioritize which components to build first based on impact and dependencies.

### Priority Tier 1: Critical (Build First) 🔴

These block core functionality:

| Component | Type | Impact | Backend API | Effort |
|-----------|------|--------|-------------|--------|
| Organization settings page | Page | High | 5 APIs needed | High |
| Team settings page | Page | High | 5 APIs needed | High |
| edit-organization-member-dialog | Dialog | High | Need API | Medium |
| remove-organization-member-dialog | Dialog | High | Need API | Medium |
| edit-team-member-dialog | Dialog | High | Need API | Medium |
| remove-team-member-dialog | Dialog | High | Need API | Medium |
| edit-organization-dialog | Dialog | High | Need API | Low |
| edit-team-dialog | Dialog | High | Need API | Low |
| delete-organization-dialog | Dialog | High | Need API | Medium |
| delete-team-dialog | Dialog | High | Need API | Medium |

**Total**: 10 components, ~15 backend APIs

---

### Priority Tier 2: Important (Build Second) 🟡

These enhance functionality significantly:

| Component | Type | Impact | Backend API | Effort |
|-----------|------|--------|-------------|--------|
| edit-profile-dialog | Dialog | Medium | Need API | Low |
| change-password-dialog | Dialog | Medium | Need API | Low |
| forgot-password page | Page | Medium | Need API | Medium |
| reset-password page | Page | Medium | Need API | Medium |
| accept-invitation-banner | Component | Medium | Exists | Low |
| revoke-invitation-dialog | Dialog | Medium | Need API | Low |
| decline-invitation-dialog | Dialog | Medium | Need API | Low |
| workspace-switcher | Component | High | None | Medium |
| edit-project-dialog | Dialog | Medium | Exists | Low |
| transfer-project-dialog | Dialog | Medium | Need API | Medium |

**Total**: 10 components, ~8 backend APIs

---

### Priority Tier 3: Polish (Build Third) 🟢

These improve UX but aren't critical:

| Component | Type | Impact | Backend API | Effort |
|-----------|------|--------|-------------|--------|
| edit-bucket-dialog | Dialog | Low | Need API | Medium |
| delete-bucket-dialog | Dialog | Low | Exists | Low |
| bucket detail page | Page | Low | Partial | Medium |
| leave-organization-dialog | Dialog | Low | Exists | Low |
| leave-team-dialog | Dialog | Low | Exists | Low |
| recent-activity-card | Component | Low | Exists | Medium |
| usage-summary-card | Component | Low | Exists | Low |

**Total**: 7 components, ~2 backend APIs

---

### Priority Tier 4: Extraction & Cleanup 🔵

Existing functionality that needs refactoring:

| Component | Type | Impact | Backend API | Effort |
|-----------|------|--------|-------------|--------|
| create-tenant-dialog (extract) | Dialog | Low | Exists | Low |
| edit-tenant-dialog (extract) | Dialog | Low | Exists | Low |
| delete-tenant-dialog (extract) | Dialog | Low | Exists | Low |
| create-api-key-dialog (extract) | Dialog | Low | Exists | Low |
| regenerate-api-key-dialog (extract) | Dialog | Low | Exists | Low |
| delete-api-key-dialog (extract) | Dialog | Low | Exists | Low |
| delete-project-dialog (complete) | Dialog | Low | Exists | Low |

**Total**: 7 components, 0 new APIs

---

## Summary Statistics

### Backend API Gaps

**Total Missing APIs**: ~25

- Organizations: 5 APIs
- Teams: 5 APIs
- User Profile: 4 APIs
- Invitations: 3 APIs
- Buckets: 2 APIs
- Projects: 1 API
- Settings: 1 API (persistence)
- Versions: 5+ APIs (entire resource)

### Frontend Component Gaps

**Total Missing Components**: 27

- Dialogs: 20
- Pages: 4
- Utility Components: 3

**Extraction/Cleanup**: 7 components

### Estimated Development Time

**Backend Development**:
- Tier 1 APIs (15): 3-4 days
- Tier 2 APIs (8): 2 days
- Tier 3 APIs (2): 0.5 days
- **Total Backend**: ~5-6 days

**Frontend Development**:
- Tier 1 Components (10): 4-5 days
- Tier 2 Components (10): 3-4 days
- Tier 3 Components (7): 2 days
- Extraction (7): 1 day
- **Total Frontend**: ~10-12 days

**Total Project**: ~15-18 days (3-4 weeks with testing)

---

## Next Steps

1. **Immediate**: Implement Tier 1 backend APIs (organization & team member management)
2. **Week 3**: Complete Tier 1 frontend components (settings pages, member management)
3. **Week 4**: Complete Tier 2 components (user profile, invitations, workspace switcher)
4. **Week 5**: Polish, extraction, and testing

---

## Conclusion

Carcosa has a solid foundation but needs ~25 backend APIs and ~27 frontend components to reach full CRUD functionality. The data model is well-designed and similar to industry standards (GitHub). The main gaps are in member management, settings pages, and user profile features.

Priority should be:
1. Member management (Tier 1) - blocks collaboration
2. Settings pages (Tier 1) - blocks basic operations
3. User profile (Tier 2) - blocks account management
4. Polish & UX (Tier 3) - improves experience

With focused effort, the project can reach production-ready state in 3-4 weeks.
