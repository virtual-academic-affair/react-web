---
description: Folder structure pattern for organizing pages with routes - pages sharing the same route prefix should be grouped in one folder
globs: src/pages/**/*.tsx,src/layouts/**/*.tsx,src/routes.tsx
---

# Page Folder Structure Pattern

## Overview

Pages that share the same route prefix should be organized in a single folder, similar to how email pages are structured.

## Structure Pattern

### Example: Email Pages
```
src/pages/emails/
  ├── config/          # Route: /admin/email/config
  │   ├── index.tsx
  │   └── components/
  │       ├── ProfileCard.tsx
  │       ├── SyncCard.tsx
  │       └── ...
  └── message/         # Route: /admin/email/messages
      ├── index.tsx
      └── components/
          ├── EmailsTable.tsx
          ├── EmailDetailDrawer.tsx
          └── ...
```

### Example: Auth Pages
```
src/pages/auth/
  ├── accounts/        # Route: /admin/auth/accounts
  │   └── index.tsx
  └── assign-role/     # Route: /admin/auth/assign-role
      └── index.tsx
```

## Rules

1. **Group by Route Prefix**: All pages with routes starting with the same prefix (e.g., `email/*`, `auth/*`) should be in the same parent folder.

2. **Folder Naming**: 
   - Use the route segment name as the folder name (e.g., `email` → `emails/`, `auth` → `auth/`)
   - Use plural form when appropriate (e.g., `emails/` for multiple email-related pages)

3. **Subfolder Structure**:
   - Each distinct route gets its own subfolder
   - The main page component should be in `index.tsx` at the subfolder root
   - Shared components for that page should be in a `components/` subfolder

4. **Component Organization**:
   - Page-specific components go in `components/` subfolder
   - Shared utilities can be at the same level as `index.tsx` (e.g., `labelUtils.ts`)

5. **Route Configuration**:
   - Routes in `src/routes.tsx` should reflect the folder structure
   - Route paths should match folder names (e.g., `email/config` → `src/pages/emails/config/`)

## Implementation Checklist

When creating a new page:
- [ ] Identify the route prefix (e.g., `auth`, `email`)
- [ ] Check if a parent folder exists for that prefix
- [ ] Create subfolder matching the route segment (e.g., `assign-role` for route `auth/assign-role`)
- [ ] Place main component in `index.tsx`
- [ ] Create `components/` folder if page has multiple components
- [ ] Update routes in `src/routes.tsx` to match folder structure
- [ ] Update `src/layouts/admin/index.tsx` to import and route the new page

## Examples

### ✅ Correct Structure
```
src/pages/emails/config/index.tsx        # Route: email/config
src/pages/emails/message/index.tsx       # Route: email/messages
src/pages/auth/accounts/index.tsx         # Route: auth/accounts
src/pages/auth/assign-role/index.tsx     # Route: auth/assign-role
```

### ❌ Incorrect Structure
```
src/pages/email-config.tsx               # Should be in emails/config/
src/pages/assignRole.tsx                 # Should be in auth/assign-role/
src/pages/users/index.tsx                # If route is auth/accounts, should be in auth/accounts/
```

## Shared Components

- **Shared components** (used across multiple pages) should be placed in `src/components/` with appropriate subfolders:
  - `src/components/filter/` - Shared filter components (e.g., `AdvancedFilterModal.tsx`)
  - `src/components/layouts/` - Shared layout components (e.g., `CreatePageLayout.tsx`)
  - `src/components/drawer/` - Shared drawer components (e.g., `Drawer.tsx`)
  - `src/components/table/` - Shared table components (e.g., `TableLayout.tsx`)
- **Page-specific components** should remain in the page's `components/` subfolder
- **When to create a shared component:**
  - Component is used in 2+ different pages/modules
  - Component has identical or very similar structure across usages
  - Component can be made generic with props/children

## Notes

- This pattern improves code organization and makes it easier to find related pages
- It scales well as the application grows
- It matches the route hierarchy visually in the file system
- Shared components reduce code duplication and ensure consistency