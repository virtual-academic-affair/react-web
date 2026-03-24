import { create } from "zustand";

interface EmailState {
  /** IDs of messages flagged as "new" after socket ingestion event */
  newMessageIds: Set<number>;
  addNewMessageIds: (ids: number[]) => void;
  clearNewMessageIds: () => void;
}

export const useEmailStore = create<EmailState>((set) => ({
  newMessageIds: new Set(),
  addNewMessageIds: (ids) =>
    set((state) => ({
      newMessageIds: new Set([...state.newMessageIds, ...ids]),
    })),
  clearNewMessageIds: () => set({ newMessageIds: new Set() }),
}));
