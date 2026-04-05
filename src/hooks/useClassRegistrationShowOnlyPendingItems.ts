import { useSyncExternalStore } from "react";
import React from "react";

const STORAGE_KEY = "vaa.classRegistrationDetail.showOnlyPendingItems";

function readFromStorage(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeToStorage(next: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* ignore */
  }
}

let cached = readFromStorage();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return cached;
}

function getServerSnapshot() {
  return false;
}

function setShowOnlyPendingItems(next: boolean) {
  writeToStorage(next);
  cached = next;
  listeners.forEach((l) => l());
}

function syncFromStorageEvent() {
  const next = readFromStorage();
  if (next !== cached) {
    cached = next;
    listeners.forEach((l) => l());
  }
}

/**
 * Bộ lọc "Chỉ hiện yêu cầu chưa giải quyết" trong drawer chi tiết đăng ký lớp — lưu localStorage, đồng bộ tab.
 */
export function useClassRegistrationShowOnlyPendingItems(): [
  boolean,
  (open: boolean) => void,
] {
  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        syncFromStorageEvent();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return [value, setShowOnlyPendingItems] as const;
}
