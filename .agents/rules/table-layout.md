---
description: Guidelines for using the TableLayout component and coding table-based pages
globs: src/pages/**/*.tsx,src/components/table/**/*.tsx
---

# Table Layout Component Guidelines

## Overview

Always use the **TableLayout** component from [TableLayout.tsx](mdc:src/components/table/TableLayout.tsx) for all table-based pages. This component provides a standardized layout with search, filter, pagination, and actions.

## Component Location

The TableLayout component is located at:

- `src/components/table/TableLayout.tsx`

## Required Imports

```typescript
import TableLayout, {
  type TableColumn,
  type TableAction,
} from "@/components/table/TableLayout";
import type { PaginatedResponse } from "@/types/common";
```

## Basic Structure

### 1. Define Table Columns

Use `TableColumn<T>[]` to define columns. Each column must have:

- `key`: Unique identifier (string)
- `header`: Column header text
- `render`: Function that returns ReactNode for cell content
- `width` (optional): Fixed width (e.g., "400px")
- `maxWidth` (optional): Maximum width (e.g., "450px")

**Example:**

```typescript
const columns: TableColumn<Message>[] = React.useMemo(
  () => [
    {
      key: "subject",
      header: "Tiêu đề",
      width: "400px",
      maxWidth: "450px",
      render: (item) => (
        <p className="text-navy-700 text-base font-medium dark:text-white">
          {item.subject}
        </p>
      ),
    },
  ],
  [dependencies],
);
```

### 2. Define Table Actions

Use `TableAction<T>[]` for row actions. Each action must have:

- `key`: Unique identifier
- `icon`: ReactNode (usually from react-icons)
- `label`: Tooltip text
- `onClick`: Handler function
- `className` (optional): Custom button styling

**Example:**

```typescript
const actions: TableAction<Message>[] = React.useMemo(
  () => [
    {
      key: "detail",
      icon: <MdInfoOutline className="h-4 w-4" />,
      label: "Chi tiết",
      onClick: handleOpenDetail,
    },
  ],
  [handleOpenDetail],
);
```

### 3. Use TableLayout Component

```typescript
<TableLayout
  result={result}                    // PaginatedResponse<T> | null
  loading={loading}                  // boolean
  page={page}                        // number
  pageSize={PAGE_SIZE}               // number (optional, default: 10)
  searchValue={keyword}               // string
  onSearchChange={setKeyword}        // (value: string) => void
  onSearch={handleSearch}            // () => void
  searchPlaceholder="Tìm..."   // string (optional)
  showFilter={true}                  // boolean (optional)
  onFilterClick={handleOpenFilter}   // () => void (optional)
  columns={columns}                   // TableColumn<T>[]
  emptyMessage="Không có dữ liệu"    // string (optional)
  actions={actions}                   // TableAction<T>[] (optional)
  onRowClick={handleRowClick}        // (item: T) => void (optional)
  onPageChange={handlePageChange}    // (page: number) => void
  detailDrawer={<DetailDrawer />}    // ReactNode (optional)
/>
```

## Best Practices

### 1. Column Rendering

- Use `React.useMemo` for columns and actions to prevent unnecessary re-renders
- Include all dependencies in the dependency array
- For long text, use `truncate` class and wrap with `Tooltip` component
- Follow typography consistency: use `text-base font-medium` for primary content, `text-sm` for secondary

### 2. Actions

- Keep action buttons consistent: `h-10 w-10 rounded-2xl`
- Use brand color (`bg-brand-500`) for primary actions
- Use `stopPropagation()` in onClick handlers to prevent row click
- Always provide `label` for accessibility (tooltip)

### 3. Search & Filter

- Search input supports Enter key automatically
- Filter button is optional - only show if `showFilter={true}`
- Handle search state in parent component
- **ALWAYS sync search keyword and filters to URL params** for:
  - Deep linking with search/filter state
  - Browser back/forward navigation
  - Sharing URLs with applied filters
  - Preserving state on page refresh
- **Pattern for URL param synchronization:**

  ```typescript
  import { useSearchParams } from "react-router-dom";

  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const [keyword, setKeyword] = React.useState(
    searchParams.get("keyword") ?? "",
  );
  const [page, setPage] = React.useState(
    Number(searchParams.get("page") ?? "1") > 0
      ? Number(searchParams.get("page") ?? "1")
      : 1,
  );
  const [filters, setFilters] = React.useState<FiltersType>(() => {
    // Initialize filters from URL params
    const enableFilter = searchParams.get("enableFilter") === "true";
    return {
      enableFilter,
      // ... other filter fields
    };
  });

  // Sync state to URL params
  React.useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) {
      next.set("keyword", keyword);
    }
    next.set("page", String(page));
    next.set("limit", String(PAGE_SIZE));
    // Add filter params if enabled
    if (filters.enableFilter) {
      next.set("enableFilter", "true");
      next.set("filterValue", String(filters.filterValue));
    }
    // Keep detail drawer id if exists
    if (selectedId != null) {
      next.set("id", String(selectedId));
    }
    setSearchParams(next, { replace: true });
  }, [filters, keyword, page, selectedId, setSearchParams]);
  ```

- **Advanced Filter Modal pattern:**
  - **Always use the shared `AdvancedFilterModal` component** from [src/components/filter/AdvancedFilterModal.tsx](mdc:src/components/filter/AdvancedFilterModal.tsx)
  - The shared component provides: backdrop overlay, card container, grid layout, and button footer
  - Page-specific filter modals should wrap the shared component and pass filter fields as `children`
  - Filter fields should use `grid grid-cols-1 gap-4 md:grid-cols-4` layout
  - Label in first column, filter component in `col-span-3`
  - Buttons at bottom: "Xóa" (clear) and "Tìm kiếm" (apply) are handled by the shared component
  - Example implementations:
    - [src/pages/auth/accounts/components/AdvancedFilterModal.tsx](mdc:src/pages/auth/accounts/components/AdvancedFilterModal.tsx)
    - [src/pages/emails/message/components/AdvancedFilterModal.tsx](mdc:src/pages/emails/message/components/AdvancedFilterModal.tsx)
    - [src/pages/class-registration/registrations/components/AdvancedFilterModal.tsx](mdc:src/pages/class-registration/registrations/components/AdvancedFilterModal.tsx)

### 4. Pagination

- Pagination is automatically handled by TableLayout
- Uses condensed page numbers (1 ... prev, current, next ... last)
- Shows "Trang X trên Y · Z bản ghi" format

### 5. Detail Drawer & URL Params

- Pass drawer component as `detailDrawer` prop (or render directly under the table page component).
- **Use URL params for row-level detail/edit wherever possible:**
  - Use `useSearchParams` to read/write an `id` param (or similar) when opening/closing drawers.
  - Example:
    - `handleOpenDetail(row)` → `next.set("id", String(row.id))`
    - Drawer `isOpen` is derived from `selectedId = searchParams.get("id")`.
    - `onClose` of drawer clears the `id` param.
- This pattern keeps the UI in sync with browser history and allows deep-linking directly into a specific row's detail.
- **Important:** When syncing URL params, preserve both search/filter state AND detail drawer id:
  ```typescript
  React.useEffect(() => {
    const next = new URLSearchParams();
    // ... sync search, page, filters ...
    // Keep detail drawer id if exists
    if (selectedId != null) {
      next.set("id", String(selectedId));
    }
    setSearchParams(next, { replace: true });
  }, [filters, keyword, page, selectedId, setSearchParams]);
  ```
- Use the `Drawer` component from `src/components/drawer/Drawer.tsx` (as used by email and users pages) for consistency.

### 6. Drawer Layout & Styling (Detail / Edit)

- Use the **2-column layout** for each field row, matching `EmailDetailDrawer` and `UserDetailDrawer`:
  ```tsx
  <div className="flex items-center gap-6">
    <div className="w-40 shrink-0">
      <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
        Label
      </p>
    </div>
    <div className="flex-1">{/* content */}</div>
  </div>
  ```

  - Use `items-start` instead of `items-center` when content is multi-line (e.g. textarea).
- **Loading state** inside drawer:
  ```tsx
  <div className="flex flex-col gap-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="dark:bg-navy-700 h-5 animate-pulse rounded bg-gray-200"
      />
    ))}
  </div>
  ```
- **Empty state**:
  ```tsx
  <p className="text-sm text-gray-600 dark:text-gray-400">Không có dữ liệu.</p>
  ```
- **“Thông số kỹ thuật” section** for system fields:
  ```tsx
  <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
    <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
      Thông số kỹ thuật
    </p>
    <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
      {/* rows with the same 2-column pattern, e.g. ID, backend IDs, timestamps */}
    </div>
  </div>
  ```
- **Primary / secondary drawer buttons**:
  - Container: `className="mt-4 flex justify-end gap-2"`.
  - Cancel:
    ```tsx
    className =
      "rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10";
    ```
  - Submit (Lưu):
    ```tsx
    className =
      "bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50";
    ```

    - **MUST include `MdSave` icon** from `react-icons/md`:

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
      </button>;
      ```

    - Always use `rounded-xl` (not `rounded-lg`) for consistency across all buttons in the app.

### 6. Optimistic Per-Row / Per-Cell Updates (Avoid UI Jank)

- **Do NOT** refetch the entire list (`fetch*` API) after a small inline update (e.g. change role, toggle active, update labels).
- Instead, update only the affected row (and ideally only the changed fields) in local state:
  - Use the `id` field to identify the row.
  - Keep the existing array reference when possible; only replace the changed item.
- Pattern for optimistic update on a single field:

```typescript
setResult((prev) =>
  prev
    ? {
        ...prev,
        items: prev.items.map((item) =>
          item.id === updated.id
            ? { ...item, someField: updated.someField }
            : item,
        ),
      }
    : prev,
);
```

- For inline editors that know only `id` + new value, pass `(id, nextValue)` upwards and apply the same pattern.
- This keeps React re-render scoped to the minimal set of cells and avoids table \"giật trắng\" khi loading lại toàn bộ.

## Example: Complete Implementation

See [src/pages/emails/message/index.tsx](mdc:src/pages/emails/message/index.tsx) for a complete example of:

- Column definitions with tooltips
- Action buttons with custom styling
- Search and filter integration
- Detail drawer integration
- URL param synchronization

## Common Patterns

### Truncated Text with Tooltip

```typescript
render: (item) => (
  <Tooltip label={item.longText}>
    <p className="text-navy-700 w-full max-w-[400px] truncate text-base font-medium dark:text-white">
      {item.longText}
    </p>
  </Tooltip>
),
```

### Custom Action Button

```typescript
{
  key: "custom",
  icon: <MdCustomIcon className="h-4 w-4" />,
  label: "Custom Action",
  onClick: handleCustom,
  className: "flex h-10 w-10 items-center justify-center rounded-2xl bg-custom-500 text-white hover:bg-custom-600",
}
```

### Row Click Handler

```typescript
onRowClick={(item) => {
  // Navigate to detail or open drawer
  handleOpenDetail(item);
}}
```

## Notes

- Always use TypeScript generics: `TableLayout<YourType>`
- Data items must have an `id` field (number or string)
- Loading state shows skeleton rows matching `pageSize`
- Empty state shows custom message when `items.length === 0`
- Table is wrapped in a `Card` component automatically
