import { useSyncExternalStore } from "react";
import React from "react";

const STORAGE_KEY = "vaa.detailShowLinkedMessage";

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

/** Đóng panel tin nhắn (vd. nút X trên drawer trái) — đồng bộ storage + mọi subscriber. */
export function setLinkedMessagePanelOpen(next: boolean) {
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
 * Đồng bộ qua localStorage (và sự kiện storage giữa các tab).
 * Dùng chung cho mọi drawer chi tiết có liên kết tin nhắn.
 */
export function useDetailLinkedMessagePanel(): [
  boolean,
  (open: boolean) => void,
] {
  const open = useSyncExternalStore(
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

  return [open, setLinkedMessagePanelOpen] as const;
}

export function resolveLinkedMessageId(
  raw: number | string | null | undefined,
): number | null {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}
