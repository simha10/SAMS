import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  _id: string;
  empId: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'director';
  managerId?: string;
  officeLocation: {
    lat: number;
    lng: number;
    radius: number;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: (user: User) => {
        console.log("=== AUTH STORE LOGIN ===");
        console.log("User:", user);
        console.log("Timestamp:", new Date().toISOString());
        set({ user, isAuthenticated: true });
        console.log("Auth store updated:", { user, isAuthenticated: true });
        console.log("=== END AUTH STORE LOGIN ===");
      },
      logout: () => {
        console.log("=== AUTH STORE LOGOUT ===");
        console.log("Timestamp:", new Date().toISOString());
        // Clear all auth-related storage
        localStorage.removeItem('auth-storage');
        sessionStorage.removeItem('auth-storage');
        set({ user: null, isAuthenticated: false });
        console.log("Auth store updated:", { user: null, isAuthenticated: false });
        console.log("=== END AUTH STORE LOGOUT ===");
      },
      setLoading: (loading: boolean) => {
        console.log("=== AUTH STORE SET LOADING ===");
        console.log("Loading:", loading);
        console.log("Timestamp:", new Date().toISOString());
        set({ isLoading: loading });
        console.log("=== END AUTH STORE SET LOADING ===");
      },
      setUser: (user: User | null) => {
        console.log("=== AUTH STORE SET USER ===");
        console.log("User:", user);
        console.log("Timestamp:", new Date().toISOString());
        set({ user });
        console.log("Auth store updated:", { user });
        console.log("=== END AUTH STORE SET USER ===");
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => {
        console.log("=== AUTH STORE REHYDRATION START ===");
        return (state, error) => {
          if (error) {
            console.error("=== AUTH STORE REHYDRATION ERROR ===");
            console.error("Error:", error);
          } else {
            console.log("=== AUTH STORE REHYDRATION COMPLETE ===");
            console.log("State:", state);
            
            // Check if we have a user but need to verify authentication
            if (state?.isAuthenticated && state?.user) {
              console.log("User is authenticated, verifying token...");
              // We could make an API call here to verify the token is still valid
            }
          }
        };
      },
    }
  )
);