---
description: Project coding guidelines for the react-fe workspace. Apply to all code generation, reviews, and refactoring tasks.
applyTo: "**/*.{ts,tsx}"
---

# Project Coding Guidelines

## Tech Stack
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (`@tailwindcss/vite` plugin) — all theme tokens live in `src/index.css` via `@theme`; no `tailwind.config.js`
- Horizon UI component library (free tier)
- Ant Design (`antd`) for feedback UI (toasts, modals, etc.)
- Axios HTTP client via `src/services/http.ts`

## Component Usage

### Prefer Horizon UI components
Always reach for existing Horizon UI components before writing new ones:
- `Card` → `src/components/card`
- `Dropdown` → `src/components/dropdown`
- `InputField` / `SwitchField` → `src/components/fields`
- `Checkbox`, `Radio`, `Switch`, `Progress`, `Tooltip`, `Popover` → matching folders under `src/components/`
- Charts: `BarChart`, `LineChart`, `LineAreaChart`, `PieChart` → `src/components/charts`

Only create a custom component when no Horizon UI component fits the use case.

### Component file separation
- Do **not** put multiple named components in `index.tsx`.
- Each distinct component gets its **own file** (e.g., `ProfileCard.tsx`, `ActionsPanel.tsx`).
- `index.tsx` for a page should only contain the main page component and its direct composition — no inlined sub-components.
- Co-locate page-specific components in a `components/` subfolder next to their page's `index.tsx`, e.g.:
  ```
  src/pages/admin/
    index.tsx
    components/
      ProfileCard.tsx
      ActionsPanel.tsx
  ```

## Notifications & Feedback
- Use **Ant Design `message`** for transient toast notifications:
  ```ts
  import { message } from "antd";
  message.success("Done!");
  message.error("Something went wrong.");
  message.loading("Syncing...", 0); // 0 = persist until manually hidden
  ```
- Use **Ant Design `notification`** for richer, persistent alerts that need a title + description.
- Do **not** render inline status divs, alert banners, or custom toast components for feedback that fits `message` or `notification`.

## Dark Mode
- Dark mode is class-based: Horizon UI toggles `.dark` on `document.body`.
- The custom variant is declared in `src/index.css`: `@custom-variant dark (&:where(.dark, .dark *));`
- Always add `dark:` variants alongside light styles (e.g., `text-navy-700 dark:text-white`).

## Data Fetching
- Lift shared data fetches to the nearest layout that owns all consumers — avoid duplicate API calls for the same data.
- Pass data down as props; do not re-fetch the same endpoint in child components.

## Styling
- Use Tailwind utility classes exclusively; no inline `style={{}}` except for dynamic values that cannot be expressed as utilities.
- Color tokens follow the Horizon UI palette defined in `src/index.css` (e.g., `text-navy-700`, `bg-brand-500`).