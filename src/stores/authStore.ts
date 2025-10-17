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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: (user: User) => {
        console.log("Auth store login called with user:", user);
        set({ user, isAuthenticated: true });
        console.log("Auth store updated:", { user, isAuthenticated: true });
      },
      logout: () => {
        console.log("Auth store logout called");
        set({ user: null, isAuthenticated: false });
        console.log("Auth store updated:", { user: null, isAuthenticated: false });
      },
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
