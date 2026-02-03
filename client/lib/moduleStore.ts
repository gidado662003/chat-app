import { create } from "zustand";
import { persist } from "zustand/middleware";
interface ModuleState {
  module: string;
  setModule: (module: string) => void;
}

export const useModuleStore = create<ModuleState>()(
  persist(
    (set) => ({
      module: "",
      setModule: (value: string) => {
        set({ module: value });
      },
    }),
    {
      name: "module-storage",
      partialize: (state) => ({ module: state.module }),
    },
  ),
);
