---
description: Standard button styling patterns for Cancel/Save actions across the application
globs: src/pages/**/*.tsx,src/components/**/*.tsx
---

# Button Styling Guidelines

## Overview

All Cancel/Save (Hủy/Lưu) buttons across the application must follow consistent styling patterns for a unified UI experience.

## Standard Button Patterns

### Cancel Button (Hủy)

**Required styling:**
```tsx
className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
```

**Example:**
```tsx
<button
  type="button"
  onClick={handleCancel}
  className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
>
  Hủy
</button>
```

### Save Button (Lưu)

**Required styling:**
```tsx
className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
```

**MUST include `MdSave` icon** from `react-icons/md`:

```tsx
import { MdSave } from "react-icons/md";

<button
  type="button" // or "submit"
  disabled={saving}
  onClick={handleSave}
  className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
>
  <MdSave className="h-4 w-4" />
  {saving ? "Đang lưu..." : "Lưu"}
</button>
```

## Key Requirements

1. **Always use `rounded-xl`** (not `rounded-lg` or other values) for all Cancel/Save buttons
2. **Save button MUST have:**
   - `flex items-center gap-1` for icon alignment
   - `MdSave` icon with `h-4 w-4` classes
   - Loading state text: `{saving ? "Đang lưu..." : "Lưu"}`
3. **Button container** (when buttons are grouped):
   ```tsx
   <div className="flex justify-end gap-2">
     {/* Cancel and Save buttons */}
   </div>
   ```

## Examples

### Drawer Footer Buttons
```tsx
<div className="mt-4 flex justify-end gap-2">
  <button
    type="button"
    onClick={handleCancel}
    className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
  >
    Hủy
  </button>
  <button
    type="submit"
    disabled={saving}
    onClick={handleSave}
    className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
  >
    <MdSave className="h-4 w-4" />
    {saving ? "Đang lưu..." : "Lưu"}
  </button>
</div>
```

### Card Header Action Buttons
```tsx
<div className="flex items-center gap-2">
  <button
    onClick={handleCancel}
    className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
  >
    Hủy
  </button>
  <button
    onClick={handleSave}
    disabled={saving}
    className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-60"
  >
    <MdSave className="h-4 w-4" />
    {saving ? "Đang lưu…" : "Lưu"}
  </button>
</div>
```

## Reference Implementation

See the following files for correct implementations:
- [LabelsCard.tsx](mdc:src/pages/emails/config/components/LabelsCard.tsx) - Card header buttons
- [RegistrationDetailDrawer.tsx](mdc:src/pages/class-registration/registrations/components/RegistrationDetailDrawer.tsx) - Drawer footer buttons
- [CancelReasonDrawer.tsx](mdc:src/pages/class-registration/cancel-reasons/components/CancelReasonDrawer.tsx) - Drawer footer buttons

### Filter Modal Buttons (Xóa / Tìm kiếm)

**Clear Button (Xóa):**
```tsx
className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
```

**Search Button (Tìm kiếm):**
```tsx
className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors"
```

**MUST include `MdSearch` icon** from `react-icons/md`:

```tsx
import { MdSearch } from "react-icons/md";

<div className="mt-5 flex justify-end gap-2">
  <button
    type="button"
    onClick={onClear}
    className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
  >
    Xóa
  </button>
  <button
    type="button"
    onClick={onApply}
    className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors"
  >
    <MdSearch className="h-4 w-4" />
    Tìm kiếm
  </button>
</div>
```

## Notes

- **Never use `rounded-lg`** for any action buttons - always use `rounded-xl`
- Save button **must always include the `MdSave` icon** - this is not optional
- Search button **must always include the `MdSearch` icon** - this is not optional
- Loading state should show "Đang lưu..." (with ellipsis) or "Đang lưu…" (with proper ellipsis character)
- Button text sizes: `text-sm` for standard buttons, `text-xs` for smaller contexts (like popovers)
