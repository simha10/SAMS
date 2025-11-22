import { create } from 'zustand';

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
  dateOfBirth?: Date | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  unusualLoginDetected: boolean;
  unusualActions: string[];
  
  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User | null) => void;
  login: (user: User, accessToken: string, refreshToken: string, unusual?: boolean, unusualActions?: string[]) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  refreshAccessToken: (newAccessToken: string) => void;
  clearUnusualLogin: () => void;
}

/**
 * Auth Store - Bearer Token Authentication (In-Memory)
 * SECURITY: Tokens are stored in memory only, NOT in localStorage/sessionStorage
 * This prevents XSS attacks from stealing tokens
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  unusualLoginDetected: false,
  unusualActions: [],
  
  setTokens: (accessToken: string, refreshToken: string) => {
    console.log('[AuthStore] Setting tokens');
    set({ accessToken, refreshToken, isAuthenticated: true });
  },
  
  setUser: (user: User | null) => {
    console.log('[AuthStore] Setting user:', user?.empId);
    set({ user });
  },
  
  login: (user: User, accessToken: string, refreshToken: string, unusual = false, unusualActions = []) => {
    console.log('[AuthStore] Login:', user.empId, unusual ? '(UNUSUAL)' : '');
    set({ 
      user, 
      accessToken, 
      refreshToken, 
      isAuthenticated: true,
      unusualLoginDetected: unusual,
      unusualActions: unusualActions || []
    });
  },
  
  logout: () => {
    console.log('[AuthStore] Logout');
    set({ 
      user: null, 
      accessToken: null, 
      refreshToken: null, 
      isAuthenticated: false,
      unusualLoginDetected: false,
      unusualActions: []
    });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  refreshAccessToken: (newAccessToken: string) => {
    console.log('[AuthStore] Refreshing access token');
    set({ accessToken: newAccessToken });
  },
  
  clearUnusualLogin: () => {
    console.log('[AuthStore] Clearing unusual login flag');
    set({ unusualLoginDetected: false, unusualActions: [] });
  }
}));