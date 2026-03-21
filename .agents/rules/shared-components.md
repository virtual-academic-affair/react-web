---
description: Guidelines for creating and using shared components across the application
globs: src/components/**/*.tsx,src/pages/**/*.tsx
---

# Shared Components Guidelines

## Overview

Shared components are reusable UI components that are used across multiple pages or modules. They should be placed in `src/components/` with appropriate subfolders.

## When to Create a Shared Component

Create a shared component when:
1. **Component is used in 2+ different pages/modules**
2. **Component has identical or very similar structure** across usages
3. **Component can be made generic** with props/children without losing clarity

## Shared Component Locations

### Filter Components
- **Location**: `src/components/filter/`
- **Example**: `AdvancedFilterModal.tsx`
- **Usage**: All advanced filter modals should use the shared `AdvancedFilterModal` base component

### Layout Components
- **Location**: `src/components/layouts/`
- **Example**: `CreatePageLayout.tsx`
- **Usage**: All create/edit pages with the same layout pattern (background gradient, centered card)

### Drawer Components
- **Location**: `src/components/drawer/`
- **Example**: `Drawer.tsx`
- **Usage**: Base drawer component used by all detail/edit drawers

### Table Components
- **Location**: `src/components/table/`
- **Example**: `TableLayout.tsx`
- **Usage**: Standard table layout with search, filter, pagination

## Pattern: Wrapping Shared Components

When a shared component needs page-specific customization, create a page-specific wrapper that uses the shared component:

```tsx
// Page-specific component
import AdvancedFilterModalBase from "@/components/filter/AdvancedFilterModal";

const AdvancedFilterModal: React.FC<Props> = ({ open, value, onChange, ... }) => {
  return (
    <AdvancedFilterModalBase
      open={open}
      onClear={handleClear}
      onApply={handleApply}
      onRequestClose={onRequestClose}
    >
      {/* Page-specific filter fields */}
      <div>
        <p className="text-navy-700 font-medium dark:text-white">Label</p>
      </div>
      <div className="col-span-3">
        {/* Filter input/component */}
      </div>
    </AdvancedFilterModalBase>
  );
};
```

## Examples

### AdvancedFilterModal Pattern
- **Shared**: [src/components/filter/AdvancedFilterModal.tsx](mdc:src/components/filter/AdvancedFilterModal.tsx)
- **Page-specific wrappers**:
  - [src/pages/auth/accounts/components/AdvancedFilterModal.tsx](mdc:src/pages/auth/accounts/components/AdvancedFilterModal.tsx)
  - [src/pages/emails/message/components/AdvancedFilterModal.tsx](mdc:src/pages/emails/message/components/AdvancedFilterModal.tsx)
  - [src/pages/class-registration/registrations/components/AdvancedFilterModal.tsx](mdc:src/pages/class-registration/registrations/components/AdvancedFilterModal.tsx)

### CreatePageLayout Pattern
- **Shared**: [src/components/layouts/CreatePageLayout.tsx](mdc:src/components/layouts/CreatePageLayout.tsx)
- **Usage**:
  - [src/pages/class-registration/create/index.tsx](mdc:src/pages/class-registration/create/index.tsx)
  - [src/pages/class-registration/cancel-reasons/create/index.tsx](mdc:src/pages/class-registration/cancel-reasons/create/index.tsx)

## Best Practices

1. **Keep shared components generic**: Use props and children to make them flexible
2. **Document props clearly**: Use TypeScript interfaces with clear descriptions
3. **Maintain consistency**: Shared components should follow the same styling patterns (see [button-styling.mdc](mdc:.cursor/rules/button-styling.mdc))
4. **Don't over-abstract**: If a component is only used once, keep it page-specific
5. **Refactor when needed**: If you find duplicate code across pages, extract to a shared component

## Notes

- Shared components reduce code duplication and ensure UI consistency
- Page-specific components should remain in the page's `components/` subfolder
- Always check if a shared component exists before creating a new one
