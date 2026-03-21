---
description: Guidelines for managing API calls, caching, and state using TanStack Query
globs: src/pages/**/*.tsx,src/hooks/**/*.ts,src/components/**/*.tsx
---

# TanStack Query Implementation Guidelines

## Overview

Always use **TanStack Query** (`@tanstack/react-query`) for making API calls and caching server state. **Do not** use raw `useEffect` and `useState` combination to fetch data manually. TanStack Query provides robust features like caching, background refetching, deduplication, and optimistic updates.

## Component Location

Queries and mutations should generally be wrapped in custom hooks within `src/hooks/` for shared state, or directly configured inside the page `index.tsx` for specific list views.

## Required Imports

```typescript
import { useQuery, useQueryClient } from "@tanstack/react-query";
```

## 1. Fetching Data (GET Requests)

### Query Definition
- **Query Key:** Must be an array, usually starting with a unique string describing the resource, followed by any variables/filters that affect the data result (e.g. `['users', { page, keyword }]`).
- **Query Function:** The API call that returns a Promise.
- **Stale Time:** Always define `staleTime` depending on data volatility. 
  - `30 * 1000` (30 seconds) is default for lists.
  - `5 * 60 * 1000` (5 minutes) for moderately static data (like config/status dropdowns).
  - Defaults to `0` if not provided (re-fetches very aggressively).

**List Example:**
```typescript
const { data: result = null, isLoading: loading } = useQuery({
  queryKey: ["users", { page, keyword, ...filters }],
  queryFn: () => usersService.getList({ page, keyword }),
  staleTime: 30 * 1000,
});
```

**Detail Example:**
```typescript
const { data: detail = null, isLoading: loadingDetail } = useQuery({
  queryKey: ["message", messageId],
  queryFn: () => messagesService.getById(messageId!),
  enabled: messageId != null, // Prevents fetching if ID is null
  staleTime: 5 * 60 * 1000,
});
```

## 2. Shared/Global Data

Extract queries that are used across multiple components into custom hooks. TanStack Query will automatically deduplicate requests so that even if 5 components call `useAdminUsers()` simultaneously, only **one** network request is sent.

**Custom Hook Example (`src/hooks/useAdminUsers.ts`):**
```typescript
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users";

export function useAdminUsers() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => usersService.getUsers({ roles: ["admin"] }),
    staleTime: 5 * 60 * 1000,
  });

  return { admins: data ?? [], isLoading };
}
```

## 3. Mutations & State Updates (POST/PUT/DELETE)

### Optimistic Updates
For seamless UI interactions (like toggling an active switch, updating a status, or modifying an inline detail), update the cache directly using `queryClient.setQueryData` after the mutation succeeds. **Avoid strictly invalidating the entire list if you can update the row directly.**

**Example:**
```typescript
const queryClient = useQueryClient();

const handleToggleActive = async (item: User, nextActive: boolean) => {
  try {
    const updated = await usersService.update(item.id, { isActive: nextActive });
    
    // Optimistic Update directly to the cached list
    queryClient.setQueryData(
      ["users", { page, keyword, ...filters }],
      (prev: PaginatedResponse<User> | null) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((x) => (x.id === updated.id ? updated : x)),
            }
          : prev,
    );
  } catch (error) {
    toast.error("Failed to update");
  }
};
```

### Invalidating Queries
For complex mutations (like deleting an item or creating an intricate record where local-only patching is difficult), invalidate the query to force a background refetch.

**Example:**
```typescript
const handleDelete = async (id: number) => {
  await itemsService.remove(id);
  // Tell TanStack Query that the ['items'] cache is obsolete so it refetches
  await queryClient.invalidateQueries({ queryKey: ["items"] });
};
```

## Summary Checklist
- [ ] No `fetchData()` inside `useEffect()`
- [ ] No manual `[loading, setLoading]` flags for API calls
- [ ] Array-based descriptive `queryKey` includes all reactive query parameters
- [ ] Thoughtful `staleTime` applied to avoid excessive network requests
- [ ] Inline modifications use `queryClient.setQueryData` instead of raw React state arrays
