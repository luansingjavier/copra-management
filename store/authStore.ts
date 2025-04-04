import { create } from "zustand";
import { loginUser } from "../database/database";
import { createJSONStorage, persist } from "zustand/middleware";

// Define custom storage for React Native
const customStorage = {
  getItem: async (name: string) => {
    console.log(`Attempting to get item: ${name}`);
    try {
      // In a real app, you would use AsyncStorage here
      // For now, we'll return the last stored value from memory
      return null;
    } catch (error) {
      console.error(`Error getting item ${name}:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    console.log(`Setting item: ${name} with value type: ${typeof value}`);
    try {
      // In a real app, you would use AsyncStorage here
      // For now we just log that we would save it
      console.log(`Would save ${name}: ${value?.substring(0, 50)}...`);
      return;
    } catch (error) {
      console.error(`Error setting item ${name}:`, error);
    }
  },
  removeItem: async (name: string) => {
    console.log(`Removing item: ${name}`);
    try {
      // In a real app, you would use AsyncStorage here
      return;
    } catch (error) {
      console.error(`Error removing item ${name}:`, error);
    }
  },
};

interface AuthState {
  user: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
}

// Default credentials (use these for login)
const VALID_USERS = [
  { username: "luansingjavier", password: "thgirb11" },
  { username: "admin", password: "admin123" },
];

// Create the auth store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        console.log(`Auth store: login attempt for ${username}`);
        set({ isLoading: true, error: null });

        try {
          // Use the Realm database for authentication
          const success = await loginUser(username, password);

          if (success) {
            console.log(`Auth store: login successful for ${username}`);
            // Set auth state all at once to avoid partial updates
            set({
              user: username,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            console.log("Auth store: login failed - invalid credentials");
            set({
              isLoading: false,
              error: "Invalid credentials. Please try again.",
            });
            return false;
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error("Auth store: login error:", errorMsg);
          set({
            isLoading: false,
            error: `Login error: ${errorMsg}`,
          });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
        console.log("User logged out");
      },

      checkAuth: () => {
        // Just log the current auth state, don't update state here
        const state = get();
        console.log("Auth state check:", {
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        console.log("Auth store: rehydrated state:", state);
      },
    }
  )
);
