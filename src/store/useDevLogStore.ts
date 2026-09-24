import { create } from 'zustand';

export type DevLogLevel = 'info' | 'warn' | 'error' | 'success';

export type DevLogEntry = {
  id: string;
  ts: number;
  level: DevLogLevel;
  tag: string;
  message: string;
};

const MAX_ENTRIES = 40;

let counter = 0;

type DevLogState = {
  entries: DevLogEntry[];
  visible: boolean;
  log: (level: DevLogLevel, tag: string, message: string) => void;
  clear: () => void;
  toggle: () => void;
  setVisible: (v: boolean) => void;
};

export const useDevLogStore = create<DevLogState>((set) => ({
  entries: [],
  visible: false,
  log: (level, tag, message) =>
    set((state) => {
      counter += 1;
      const entry: DevLogEntry = {
        id: `log_${counter}_${Date.now()}`,
        ts: Date.now(),
        level,
        tag,
        message,
      };
      const next = [...state.entries, entry];
      if (next.length > MAX_ENTRIES) {
        next.splice(0, next.length - MAX_ENTRIES);
      }
      return { entries: next };
    }),
  clear: () => set({ entries: [] }),
  toggle: () => set((state) => ({ visible: !state.visible })),
  setVisible: (v) => set({ visible: v }),
}));

export function devLog(level: DevLogLevel, tag: string, message: string): void {
  useDevLogStore.getState().log(level, tag, message);
}