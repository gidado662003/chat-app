// client/lib/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  _id?: string;
  id?: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, // Start with no user
      isAuthenticated: false,
      isLoading: true, // Start loading while hydrating

      setUser: (user) => {
        // Normalize the user object to always have _id
        const normalizedUser = user
          ? {
              ...user,
              _id: user._id || user.id, // Handle both _id and id from API
            }
          : null;

        set({
          user: normalizedUser,
          isAuthenticated: !!normalizedUser,
          isLoading: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      logout: () => {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("erp_token");
        }
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: "auth-storage", // Key for localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set loading to false after hydration is complete
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);
