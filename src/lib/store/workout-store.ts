import { create } from "zustand";

interface RestTimerState {
  endTime: number | null;
  duration: number;
  isRunning: boolean;
}

interface WorkoutStore {
  restTimer: RestTimerState;
  startRestTimer: (duration: number) => void;
  stopRestTimer: () => void;
  tickRestTimer: () => void;
}

export const useWorkoutStore = create<WorkoutStore>()((set, get) => ({
  restTimer: { endTime: null, duration: 60, isRunning: false },

  startRestTimer: (duration: number) => {
    set({
      restTimer: { endTime: Date.now() + duration * 1000, duration, isRunning: true },
    });
  },

  stopRestTimer: () => {
    set((state) => ({
      restTimer: { ...state.restTimer, endTime: null, isRunning: false },
    }));
  },

  tickRestTimer: () => {
    const { restTimer } = get();
    if (!restTimer.isRunning || !restTimer.endTime) return;
    if (Date.now() >= restTimer.endTime) {
      set({ restTimer: { ...restTimer, isRunning: false, endTime: null } });
    }
  },
}));
