import { create } from "zustand";

interface AppStore {
  sidebarOpen: boolean;
  restTimerDuration: number;
  setSidebarOpen: (open: boolean) => void;
  setRestTimerDuration: (seconds: number) => void;
}

export const useAppStore = create<AppStore>()((set) => ({
  sidebarOpen: false,
  restTimerDuration: 90,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setRestTimerDuration: (seconds) => set({ restTimerDuration: seconds }),
}));
