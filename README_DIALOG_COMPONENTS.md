# Carcosa Dashboard Dialog Components - Complete Analysis

This directory contains a comprehensive analysis of all dialog components used in the Carcosa dashboard application.

## Reports Available

### 1. DIALOG_COMPONENTS_SUMMARY.txt (278 lines)
**Quick Overview for Busy Developers**
- Executive summary with key statistics
- Complete list of existing dialogs (7 total)
- Complete list of missing dialogs (12+)
- CRUD coverage matrix
- Implementation recommendations organized by priority
- Best for: Quick lookup, decision-making, high-level overview

### 2. DIALOG_COMPONENTS_QUICK_REFERENCE.md (168 lines)
**Implementation Guide & Template**
- Quick lookup table of all existing dialogs
- Implementation template for new dialogs
- Key patterns from existing implementations
- List of files needing extraction
- Coverage summary
- Best for: Implementing new dialogs, following standards, extracting code

### 3. DIALOG_COMPONENTS_INVENTORY.md (381 lines)
**Comprehensive Technical Reference**
- Detailed breakdown of each existing dialog
- Inline dialog analysis
- Complete missing dialog specifications
- Entity relationship hierarchy
- Implementation patterns observed
- Checklist for new dialogs
- Best for: Deep understanding, planning, detailed reference

## Key Statistics

| Metric | Count | Status |
|--------|-------|--------|
| Complete Dialogs | 7 | All functional |
| Inline Dialogs | 3 | Need extraction |
| Missing Dialogs | 12+ | Needed for full CRUD |
| Total Operations | 20+ | ~40% coverage |
| Files Analyzed | 12 | Component files |

## Dialog Categories

### Existing (7 Complete)
1. CreateOrganizationDialog - CREATE
2. CreateTeamDialog - CREATE
3. CreateProjectDialog - CREATE
4. CreateAppDialog - CREATE
5. CreateBucketDialog - CREATE
6. InviteUserDialog - CREATE
7. BucketSharingDialog - UPDATE/DELETE

### Inline (3, Need Extraction)
1. Tenant Dialogs (in app-tenants.tsx) - CREATE/UPDATE/DELETE
2. API Key Dialogs (in app-api-keys.tsx) - CREATE/REGEN/REVOKE
3. Delete Project (in app-settings.tsx) - DELETE (incomplete)

### Missing (12+)
**High Priority (6):**
- edit-organization-dialog
- delete-organization-dialog
- edit-team-dialog
- delete-team-dialog
- edit-member-role-dialog
- remove-member-dialog

**Medium Priority (4):**
- edit-project-dialog
- delete-project-dialog
- edit-bucket-dialog
- delete-bucket-dialog

**Low Priority (2):**
- revoke-invitation-dialog
- edit-api-key-dialog

## Quick Start for Developers

### Implementing a New Dialog

1. Use the template from DIALOG_COMPONENTS_QUICK_REFERENCE.md
2. Follow the naming pattern: `{action}-{entity}-dialog.tsx`
3. Use these props: `open`, `onOpenChange`, `onSuccess`
4. Reference DIALOG_COMPONENTS_INVENTORY.md for patterns
5. See checklist in inventory for complete requirements

### Extracting Inline Dialogs

1. Tenant: Extract from app-tenants.tsx (lines 265-375)
2. API Keys: Extract from app-api-keys.tsx (lines 286-400+)
3. Project Delete: Extract from app-settings.tsx (lines 154-202)

See DIALOG_COMPONENTS_QUICK_REFERENCE.md for specific line numbers.

### Understanding the Hierarchy

The entity hierarchy is:

```
Organization (OWNER)
├─ Teams
│  ├─ Team Members
│  └─ Projects
│     ├─ API Keys
│     └─ Tenants
└─ Buckets (shared with Teams)
```

Each level needs CREATE, EDIT, DELETE dialogs for full CRUD coverage.

## CRUD Coverage by Entity

| Entity | Create | Edit | Delete | Read |
|--------|--------|------|--------|------|
| Organization | ✓ | ✗ | ✗ | ✓ |
| Team | ✓ | ✗ | ✗ | ✓ |
| Team Member | ✓* | ✗ | ✗ | ✓ |
| Project | ✓ | ✗ | ~ | ✓ |
| Bucket | ✓ | ✗ | ✗ | ✓ |
| API Key | ✓ | ~ | ✓ | ✓ |
| Tenant | ✓ | ✓ | ✓ | ✓ |
| Bucket Access | ✓ | ~ | ✓ | ✓ |

Legend: ✓ Complete, ~ Partial/Inline, ✗ Missing, *Invite only

## Implementation Patterns

### What Works (from existing dialogs)
- `open`/`onOpenChange` prop pattern for state
- Toast notifications for feedback
- Auto-slug generation from names
- Form validation before submission
- Disabled states during loading
- Reset form on success

### What's Missing (for edit/delete)
- Pre-filling forms with existing data
- Impact warnings for destructive actions
- Multi-step confirmations
- Visual role comparisons
- Extracted/reusable components

## File Locations

All dialog components are in:
```
/apps/web/carcosa/components/dashboard/
```

Each dialog should be a separate file following the naming pattern:
```
{action}-{entity}-dialog.tsx
```

Examples:
- `create-organization-dialog.tsx` (exists)
- `edit-organization-dialog.tsx` (missing)
- `delete-organization-dialog.tsx` (missing)

## Next Steps

### Immediate (Sprint 1)
- [ ] Extract tenant dialogs from app-tenants.tsx
- [ ] Extract API key dialogs from app-api-keys.tsx
- [ ] Fix delete-project-dialog stub in app-settings.tsx

### Short Term (Sprint 2-3)
- [ ] Create edit-organization-dialog
- [ ] Create delete-organization-dialog
- [ ] Create edit-team-dialog
- [ ] Create delete-team-dialog
- [ ] Create edit-member-role-dialog
- [ ] Create remove-member-dialog

### Medium Term (Sprint 4-5)
- [ ] Create edit-project-dialog
- [ ] Create delete-project-dialog
- [ ] Create edit-bucket-dialog
- [ ] Create delete-bucket-dialog

### Long Term (As Needed)
- [ ] Create revoke-invitation-dialog
- [ ] Create edit-api-key-dialog (if needed)

## References

- Dialog Components: `/apps/web/carcosa/components/dashboard/`
- UI Library: `@carcosa/ui` (Dialog component)
- Toast Library: `react-hot-toast`
- Icons: `lucide-react`
- Database Schema: `/packages/database/prisma/schema.prisma`
- Form Pattern: React hooks (useState)
- Styling: Tailwind CSS + shadcn/ui components

## Questions?

Refer to the appropriate report:
- **"How do I implement a new dialog?"** → DIALOG_COMPONENTS_QUICK_REFERENCE.md
- **"What dialogs are missing?"** → DIALOG_COMPONENTS_SUMMARY.txt
- **"Tell me everything about dialogs"** → DIALOG_COMPONENTS_INVENTORY.md
- **"What's the implementation pattern?"** → DIALOG_COMPONENTS_QUICK_REFERENCE.md
- **"What needs to be extracted?"** → DIALOG_COMPONENTS_QUICK_REFERENCE.md

---

**Report Generated:** 2025-11-14
**Scope:** Dashboard dialog components in apps/web/carcosa/components/dashboard/
**Analysis Depth:** Comprehensive (all component files reviewed)
