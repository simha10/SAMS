import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { clearAttendanceCache } from '@/utils/attendanceCache';
import { clearProfileCache } from '@/utils/profileCache';
import { useAttendanceStore } from '@/stores/attendanceStore';

interface User {
  _id: string;
  empId: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'director';
  managerId?: string;
  dob?: string; // Added DOB field
  mobile?: string; // Add mobile field
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
  isOfflineAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setIsOfflineAuthenticated: (value: boolean) => void;
  setUser: (user: User | null) => void;
  // Add a method to validate current user session
  validateCurrentUser: (currentUser: User | null) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isOfflineAuthenticated: false,
      login: (user: User) => {
        console.log("=== AUTH STORE LOGIN ===");
        console.log("User:", user);
        console.log("Timestamp:", new Date().toISOString());
        set({ user, isAuthenticated: true });
        console.log("Auth store updated:", { user, isAuthenticated: true });
        console.log("=== END AUTH STORE LOGIN ===");
      },
      logout: async () => {
        console.log("=== AUTH STORE LOGOUT ===");
        console.log("Timestamp:", new Date().toISOString());
        
        try {
          // Call backend logout endpoint to clear server-side cookies
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          console.log("Backend logout response:", response.status);
        } catch (error) {
          console.error("Backend logout error:", error);
        }
        
        // Clear all auth-related storage
        localStorage.removeItem('auth-storage');
        sessionStorage.removeItem('auth-storage');
        // Also clear any other potential auth storage
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        // Clear attendance cache
        clearAttendanceCache();
        // Clear profile cache
        clearProfileCache();
        // Clear attendance store
        useAttendanceStore.getState().clearTodayAttendance();
        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // Update state immediately
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
      setIsOfflineAuthenticated: (value: boolean) => {
        console.log("=== AUTH STORE SET OFFLINE AUTHENTICATED ===");
        console.log("Value:", value);
        console.log("Timestamp:", new Date().toISOString());
        set({ isOfflineAuthenticated: value });
        console.log("Auth store updated:", { isOfflineAuthenticated: value });
        console.log("=== END AUTH STORE SET OFFLINE AUTHENTICATED ===");
      },
      // Method to validate if the current user data is still valid
      validateCurrentUser: (currentUser: User | null): boolean => {
        // If there's no current user, it's not valid
        if (!currentUser) {
          return false;
        }
        
        // Get the current state
        const state = get();
        
        // If there's no user in state, it's not valid
        if (!state.user) {
          return false;
        }
        
        // Compare user IDs to ensure they match
        return state.user._id === currentUser._id;
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage), // Use localStorage instead of sessionStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isOfflineAuthenticated: state.isOfflineAuthenticated
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
              console.log("User is authenticated, token should be valid...");
            }
          }
        };
      },
    }
  )
);