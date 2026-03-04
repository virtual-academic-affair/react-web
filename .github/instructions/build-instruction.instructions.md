---
description: Project coding guidelines for the react-fe workspace. Apply to all code generation, reviews, and refactoring tasks.
applyTo: "**/*.{ts,tsx}"
---

# Project Coding Guidelines

## Core Principles

### Consistency & Architecture

- Always prefer **shared components** from `src/components/` over custom per-feature solutions
- Reuse existing patterns, naming conventions, folder structures, and service architecture
- **Service Layer Pattern**: All API calls go through services in `src/services/` — never call `http` or `axios` directly from components
- **Path Aliases**: Always use `@/` for imports from `src/` (configured in tsconfig)
- **Type Safety**: Full TypeScript coverage, no `any` types

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (`@tailwindcss/vite` plugin) — all theme tokens live in `src/index.css` via `@theme`; no `tailwind.config.js`
- Horizon UI component library (free tier)
- Chakra UI for Modal, Popover, Tooltip
- Ant Design (`antd`) for feedback UI (message, notification, Drawer, Spin)
- React Icons (`react-icons/md`, `react-icons/hi`) — primary icon library
- Axios HTTP client via `src/services/http.ts`

## Component Usage

### Component Library Priority

**Priority Order:**
1. **Custom Components** (`src/components/`) - Reuse Card, Widget, Charts, etc.
2. **Chakra UI** - Modal, Popover, Tooltip
3. **Ant Design** - message, notification, Drawer, Spin, Select
4. **TailwindCSS Utilities** - For custom styling

### Available Horizon UI Components

Always reach for existing components before writing new ones:

- `Card` → `src/components/card`
- `Dropdown` → `src/components/dropdown`
- `InputField` / `SwitchField` → `src/components/fields`
- `Checkbox`, `Radio`, `Switch`, `Progress`, `Tooltip`, `Popover` → matching folders under `src/components/`
- Charts: `BarChart`, `LineChart`, `LineAreaChart`, `PieChart` → `src/components/charts`
- `Widget` → `src/components/widget` — for dashboard metrics cards

Only create a custom component when no existing component fits the use case.

### Component File Organization

- Do **not** put multiple named components in `index.tsx`
- Each distinct component gets its **own file** (e.g., `ProfileCard.tsx`, `UsersTable.tsx`)
- `index.tsx` for a page should only contain the main page component — no inlined sub-components
- Co-locate page-specific components in a `components/` subfolder next to their page's `index.tsx`:
  ```
  src/pages/users/
    index.tsx
    components/
      UsersTable.tsx
      UserDetailDrawer.tsx
      AssignRoleDrawer.tsx
  ```
- Components should be < 300 lines — extract sub-components if longer

### Icons

- Use **React Icons** exclusively: `react-icons/md` (Material Design), `react-icons/hi` (Heroicons)
- Avoid mixing too many icon families — stick to 2-3 max
- Example: `import { MdDashboard, MdPeople } from "react-icons/md"`

## Notifications & Feedback

- Use **Ant Design `message`** for transient toast notifications:
  ```ts
  import { message } from "antd";
  message.success("Thành công!");
  message.error("Có lỗi xảy ra.");
  message.loading("Đang xử lý...", 0); // 0 = persist until manually hidden
  ```
- Use **Ant Design `notification`** for richer, persistent alerts with title + description
- Use **Ant Design `Spin`** for loading states
- Do **not** render inline status divs, alert banners, or custom toast components for feedback that fits `message` or `notification`


**Backend Response Structure:**
```typescript
// Backend returns nested pagination
interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    currentPage: number;
    limit: number;
    totalPages: number;
  };
}
```

## Naming Conventions

**Files:**
- Components: PascalCase — `UsersTable.tsx`, `UserDetailDrawer.tsx`
- Services: camelCase — `users.service.ts`, `messages.service.ts`
- Types: camelCase — `users.ts`, `email.ts`, `common.ts`

**Component Props:**
- Event handlers (props): `onSubmit`, `onClick`, `onSuccess`, `onClose`
- Event handlers (internal): `handleSubmit`, `handleClick`, `handleSuccess`

**State Variables:**
- Boolean: `isLoading`, `isOpen`, `hasError`
- Arrays: plural — `messages`, `users`, `labels`
- Single items: singular — `selectedUser`, `currentPage`

## Dark Mode

- Dark mode is class-based: Horizon UI toggles `.dark` on `document.body`
- The custom variant is declared in `src/index.css`: `@custom-variant dark (&:where(.dark, .dark *))`
- Always add `dark:` variants alongside light styles (e.g., `text-navy-700 dark:text-white`)

## Interaction & Animation

### CSS Transitions (Not Framer Motion)

Use **CSS transitions** via Tailwind utilities:

```tsx
// Standard transition
className="transition-all duration-200 hover:shadow-lg"

// Color transition
className="transition-colors duration-150 hover:bg-brand-600"

// Transform
className="transition-transform hover:scale-105"
```

**Animation Guidelines:**
- Duration: 150-300ms for UI feedback (hover, active)
- Use `ease-in-out` or `ease-out` for natural feel
- Keep animations subtle — avoid overload
- Loading spinners: Use Tailwind's `animate-spin` or Ant Design's `Spin`

### Interactive Elements

- **Buttons**: Must have hover, active, and disabled states
- **Cards**: Add `hover:shadow-lg` for clickable cards
- **Inputs**: Focus states with `focus:border-blue-500` or `focus:ring-2 focus:ring-blue-500`
- **Links**: Color change on hover with `transition-colors`

## Styling

### TailwindCSS First

- Use TailwindCSS v4 utilities for **all styling**
- All spacing must use Tailwind's scale (`p-4`, `gap-6`, `mt-8`, etc.)
- No inline `style={{}}` except for dynamic values that cannot be expressed as utilities
- Color tokens follow the Horizon UI palette defined in `src/index.css` (e.g., `text-navy-700`, `bg-brand-500`)

**Key Tailwind Patterns in This Project:**
```tsx
// Cards - modern dashboard aesthetic
className="rounded-3xl bg-white shadow-md shadow-[#F3F3F3] dark:bg-navy-800"

// Responsive grids
className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"

// Dark mode support
className="bg-white dark:bg-navy-800 text-navy-700 dark:text-white"

// Buttons with transitions
className="rounded-lg bg-brand-500 px-4 py-2 text-white transition-colors hover:bg-brand-600"
```

### Modern Dashboard Aesthetic

- The UI follows a **modern dashboard** design with:
  - Rounded corners (`rounded-3xl` for cards, `rounded-lg` for buttons/inputs)
  - Soft shadows (`shadow-md`, `shadow-lg`)
  - Clean white/navy color scheme with dark mode support
  - Subtle gradients for accent elements
  - Smooth transitions on hover/active states

### Consistent Visual Treatment

- All cards use consistent structure: `rounded-3xl`, `shadow-md`, `bg-white dark:bg-navy-800`
- Buttons have clear hover states with `transition-all` or `transition-colors`
- Use color hierarchy:
  - Primary actions: `bg-brand-500` (blue)
  - Secondary: `bg-gray-200`
  - Destructive: `bg-red-500`
  - Success: `bg-green-500`
- Maintain spacing consistency: `gap-4` or `gap-5` between card grids

### Responsive Design
- Try to use or create responsive utilities to ensure the UI looks good on all screen sizes
