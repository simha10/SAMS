import axios from 'axios';
import type { User, AttendanceRecord, LeaveRequest, ApiResponse, RegisterData, LeaveRequestData, } from '@/types';
import { toast } from '@/components/ui/sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Add a flag to track initialization
let isInitializing = true;
setTimeout(() => {
  isInitializing = false;
}, 1000); // Set to false after 1 second to allow initial requests

// Create axios instance with default config
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // Important for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a flag to track if we've shown the auth error toast
let hasShownAuthError = false;

// Add request interceptor to add a small delay between requests to prevent rate limiting
let lastRequestTime = 0;
const minRequestInterval = 500; // Increased from 200 to 500ms

api.interceptors.request.use(
  async (config) => {
    console.log("=== API REQUEST ===");
    console.log("Method:", config.method?.toUpperCase());
    console.log("URL:", config.url);
    console.log("Data:", config.data);
    console.log("Timestamp:", new Date().toISOString());

    // Ensure credentials are included
    config.withCredentials = true;

    // Add delay between requests to prevent rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    console.log(`Time since last request: ${timeSinceLastRequest}ms`);

    if (timeSinceLastRequest < minRequestInterval) {
      const delay = minRequestInterval - timeSinceLastRequest;
      console.log(`Adding delay of ${delay}ms to prevent rate limiting`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    lastRequestTime = Date.now();

    console.log("=== END API REQUEST ===");
    return config;
  },
  (error) => {
    console.error("=== API REQUEST ERROR ===");
    console.error("Error:", error);
    console.error("=== END API REQUEST ERROR ===");
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle infinite loading states
let pendingRequests = 0;
let loadingTimeout: ReturnType<typeof setTimeout> | null = null;

const showLoadingState = () => {
  // This is just for debugging - in a real app you might want to show a global loading indicator
  console.log('Global loading state activated');
};

const hideLoadingState = () => {
  // This is just for debugging - in a real app you might want to hide a global loading indicator
  console.log('Global loading state deactivated');
};

api.interceptors.request.use(
  (config) => {
    // Skip loading state for initialization requests
    if (isInitializing) return config;
    
    pendingRequests++;
    if (pendingRequests === 1) {
      // Show loading state after a small delay to avoid flickering
      loadingTimeout = setTimeout(showLoadingState, 300);
    }
    return config;
  },
  (error) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    if (pendingRequests === 0) {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      hideLoadingState();
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    if (pendingRequests === 0) {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      hideLoadingState();
    }
    return response;
  },
  (error) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    if (pendingRequests === 0) {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      hideLoadingState();
      
      // If we get a 401 and we're not on the login page, redirect to login
      // But only if we're not in initialization phase
      if (!isInitializing && error.response?.status === 401 && window.location.pathname !== '/login') {
        // Clear auth state
        localStorage.removeItem('auth-storage');
        sessionStorage.removeItem('auth-storage');
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        // Redirect to login after a small delay to allow error handling
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);



// Auth API
export const authAPI = {
  login: async (empId: string, password: string): Promise<ApiResponse<{ user: User }>> => {
    console.log("Calling login API with:", { empId, password });
    try {
      // Clear any existing auth data before login
      localStorage.removeItem('auth-storage');
      sessionStorage.removeItem('auth-storage');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      const response = await api.post('/auth/login', { empId, password });
      console.log("Login API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Login API error:", error);
      throw error;
    }
  },

  logout: async (): Promise<ApiResponse> => {
    try {
      const response = await api.post('/auth/logout', {}, {
        // Add timeout and ensure credentials are sent
        timeout: 5000,
        withCredentials: true
      });
      // Clear local storage and cookies on logout
      localStorage.removeItem('auth-storage');
      sessionStorage.removeItem('auth-storage');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('rateLimitError');
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      toast.success("Logged out", {
        description: "You have been successfully logged out.",
      });
      return response.data;
    } catch (error) {
      console.error('Logout API error:', error);
      // Even if the API call fails, we still want to clear local state
      // Clear local storage and cookies on logout
      localStorage.removeItem('auth-storage');
      sessionStorage.removeItem('auth-storage');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('rateLimitError');
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      toast.success("Logged out", {
        description: "You have been successfully logged out.",
      });
      // Don't throw error to ensure user is logged out locally even if server fails
      return { success: true, message: 'Logged out successfully' };
    }
  },

  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Endpoint for validating token and getting user info
  validateToken: async (): Promise<ApiResponse<{ user: User }>> => {
    try {
      // Add a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await api.get('/auth/profile', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.data;
    } catch (error: any) {
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        throw new Error('Token validation timed out');
      }
      throw error;
    }
  },

  updateProfile: async (userData: { name?: string; email?: string; dob?: string; mobile?: string }): Promise<ApiResponse<{ user: User }>> => {
    try {
      const response = await api.put('/auth/profile', userData);
      toast.success("Profile updated", {
        description: "Your profile has been updated successfully.",
      });
      return response.data;
    } catch (error) {
      toast.error("Update failed", {
        description: "Could not update profile. Please try again.",
      });
      throw error;
    }
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string
  }): Promise<ApiResponse> => {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      toast.success("Password changed", {
        description: "Your password has been changed successfully.",
      });
      return response.data;
    } catch (error: any) {
      toast.error("Password change failed", {
        description: error.response?.data?.message || "Could not change password. Please try again.",
      });
      throw error;
    }
  },

  register: async (userData: RegisterData): Promise<ApiResponse<{ user: User }>> => {
    try {
      const response = await api.post('/auth/register', userData);
      toast.success("User registered", {
        description: "User has been successfully registered.",
      });
      return response.data;
    } catch (error) {
      toast.error("Registration failed", {
        description: "Could not register user. Please try again.",
      });
      throw error;
    }
  }
};

interface GeofenceErrorData {
  distance: number;
  allowedRadius: number;
  flagged: boolean;
}

// Attendance API
export const attendanceAPI = {
  checkin: async (lat: number, lng: number, branchId: string): Promise<ApiResponse<{ checkInTime: string; distance: number; status: string } | GeofenceErrorData>> => {
    try {
      const response = await api.post('/attendance/checkin', { lat, lng, branchId });
      return response.data;
    } catch (error) {
      toast.error("Check-in failed", {
        description: "Could not complete check-in. Please try again.",
      });
      throw error;
    }
  },

  checkout: async (lat: number, lng: number, branchId: string): Promise<ApiResponse<{ checkOutTime: string; distance: number; workingHours: number } | GeofenceErrorData>> => {
    try {
      const response = await api.post('/attendance/checkout', { lat, lng, branchId });
      return response.data;
    } catch (error) {
      toast.error("Check-out failed", {
        description: "Could not complete check-out. Please try again.",
      });
      throw error;
    }
  },

  getMyAttendance: async (from?: string, to?: string): Promise<ApiResponse<{ attendance: AttendanceRecord[]; total: number }>> => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const response = await api.get(`/attendance/me?${params}`, {
      timeout: 5000,
    });
    return response.data;
  },

  getTodayStatus: async (): Promise<ApiResponse<{ date: string; attendance: AttendanceRecord }>> => {
    const response = await api.get('/attendance/today', {
      timeout: 5000,
    });
    return response.data;
  },

};

// Leave API
export const leaveAPI = {
  createLeaveRequest: async (leaveData: LeaveRequestData): Promise<ApiResponse<{ leaveRequest: LeaveRequest }>> => {
    try {
      const response = await api.post('/leaves', leaveData);
      toast.success("Leave request submitted", {
        description: "Your leave request has been submitted successfully.",
      });
      return response.data;
    } catch (error) {
      toast.error("Leave request failed", {
        description: "Could not submit leave request. Please try again.",
      });
      throw error;
    }
  },

  getMyLeaveRequests: async (): Promise<ApiResponse<{ leaveRequests: LeaveRequest[]; total: number }>> => {
    const response = await api.get('/leaves/me');
    return response.data;
  },

  cancelLeaveRequest: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/leaves/${id}`);
    return response.data;
  },

  // Add delete method for deleting leave requests
  deleteLeaveRequest: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/leaves/${id}`);
    toast.success("Leave request deleted", {
      description: "Your leave request has been deleted successfully.",
    });
    return response.data;
  }
};

// Manager API
export const managerAPI = {
  getTeamAttendance: async (date: string) => {
    try {
      const response = await api.get(`/manager/team/attendance?date=${date}`);
      return response.data;
    } catch (error) {
      toast.error("Failed to load team attendance", {
        description: "Could not load team attendance data. Please try again.",
      });
      throw error;
    }
  },

  getFlaggedAttendance: async (from?: string, to?: string) => {
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await api.get(`/manager/team/flagged?${params}`);
      return response.data;
    } catch (error) {
      toast.error("Failed to load flagged attendance", {
        description: "Could not load flagged attendance records. Please try again.",
      });
      throw error;
    }
  },

  getTeamLeaveRequests: async () => {
    try {
      const response = await api.get('/manager/team/leaves');
      return response.data;
    } catch (error) {
      toast.error("Failed to load leave requests", {
        description: "Could not load team leave requests. Please try again.",
      });
      throw error;
    }
  },

  updateLeaveRequest: async (id: string, status: string, rejectionReason?: string) => {
    try {
      const response = await api.put(`/manager/leaves/${id}`, {
        status,
        rejectionReason
      });
      toast.success(`Leave request ${status}`, {
        description: `Leave request has been ${status} successfully.`,
      });
      return response.data;
    } catch (error) {
      toast.error("Failed to update leave request", {
        description: "Could not update leave request. Please try again.",
      });
      throw error;
    }
  },

  // New method for updating attendance status
  updateAttendanceStatus: async (id: string, status: string, approvalReason?: string, checkOutTime?: string) => {
    try {
      const response = await api.put(`/manager/attendance/${id}`, {
        status,
        approvalReason,
        checkOutTime
      });
      toast.success("Attendance record updated", {
        description: "Attendance record has been updated successfully.",
      });
      return response.data;
    } catch (error) {
      toast.error("Failed to update attendance record", {
        description: "Could not update attendance record. Please try again.",
      });
      throw error;
    }
  },

  // New method for updating employee details
  updateEmployee: async (id: string, employeeData: Partial<User>) => {
    try {
      const response = await api.put(`/manager/employees/${id}`, employeeData);
      toast.success("Employee updated", {
        description: "Employee has been updated successfully.",
      });
      return response.data;
    } catch (error) {
      toast.error("Failed to update employee", {
        description: "Could not update employee. Please try again.",
      });
      throw error;
    }
  },

  // New method for deleting/deactivating an employee
  deleteEmployee: async (id: string) => {
    try {
      const response = await api.delete(`/manager/employees/${id}`);
      toast.success("Employee deactivated", {
        description: "Employee has been deactivated successfully.",
      });
      return response.data;
    } catch (error) {
      toast.error("Failed to deactivate employee", {
        description: "Could not deactivate employee. Please try again.",
      });
      throw error;
    }
  },

  getRecentActivities: async (period: string) => {
    try {
      const response = await api.get(`/manager/team/activities?period=${period}`);
      return response.data;
    } catch (error) {
      toast.error("Failed to load activities", {
        description: "Could not load recent activities. Please try again.",
      });
      throw error;
    }
  },

  // Holiday management methods
  createHoliday: async (date: string, name: string, description?: string) => {
    try {
      const response = await api.post('/manager/holidays', { date, name, description });
      toast.success("Holiday created", {
        description: "Holiday has been created successfully.",
      });
      return response.data;
    } catch (error: any) {
      toast.error("Failed to create holiday", {
        description: error.response?.data?.message || "Could not create holiday. Please try again.",
      });
      throw error;
    }
  },

  getHolidays: async (year?: string, month?: string) => {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);

      const response = await api.get(`/manager/holidays?${params}`);
      return response.data;
    } catch (error) {
      toast.error("Failed to load holidays", {
        description: "Could not load holidays. Please try again.",
      });
      throw error;
    }
  },

  updateHoliday: async (id: string, date: string, name: string, description?: string) => {
    try {
      const response = await api.put(`/manager/holidays/${id}`, { date, name, description });
      toast.success("Holiday updated", {
        description: "Holiday has been updated successfully.",
      });
      return response.data;
    } catch (error: any) {
      toast.error("Failed to update holiday", {
        description: error.response?.data?.message || "Could not update holiday. Please try again.",
      });
      throw error;
    }
  },

  deleteHoliday: async (id: string) => {
    try {
      const response = await api.delete(`/manager/holidays/${id}`);
      toast.success("Holiday deleted", {
        description: "Holiday has been deleted successfully.",
      });
      return response.data;
    } catch (error) {
      toast.error("Failed to delete holiday", {
        description: "Could not delete holiday. Please try again.",
      });
      throw error;
    }
  }
};

// Report API
export const reportAPI = {
  // Preview report functionality
  previewReport: async (reportData: {
    type: string;
    startDate: string;
    endDate: string;
    filters?: Record<string, any>;
  }) => {
    try {
      // Log the data being sent for debugging
      console.log("=== PREVIEW REPORT REQUEST DATA ===");
      console.log("Type:", reportData.type);
      console.log("Start Date:", reportData.startDate);
      console.log("End Date:", reportData.endDate);
      console.log("Filters:", reportData.filters);

      // Validate required fields
      if (!reportData.type) {
        throw new Error("Report type is required");
      }

      if (!reportData.startDate) {
        throw new Error("Start date is required");
      }

      if (!reportData.endDate) {
        throw new Error("End date is required");
      }

      // Validate dates
      const start = new Date(reportData.startDate);
      const end = new Date(reportData.endDate);

      // Check if dates are valid
      if (isNaN(start.getTime())) {
        throw new Error("Invalid start date format");
      }

      if (isNaN(end.getTime())) {
        throw new Error("Invalid end date format");
      }

      if (end < start) {
        throw new Error("End date must be after start date");
      }

      const response = await api.post('/reports/preview', reportData);
      return response.data;
    } catch (error: any) {
      console.error("Preview report error:", error);
      toast.error("Failed to preview report", {
        description: error.response?.data?.message || "Could not generate report preview. Please try again.",
      });
      throw error;
    }
  },

  // Stream report for direct download
  streamReport: async (reportData: {
    type: string;
    format?: string;
    startDate: string;
    endDate: string;
    filters?: Record<string, any>;
  }): Promise<Blob> => {
    try {
      // Validate required fields
      if (!reportData.type) {
        throw new Error("Report type is required");
      }

      if (!reportData.startDate) {
        throw new Error("Start date is required");
      }

      if (!reportData.endDate) {
        throw new Error("End date is required");
      }

      // Validate dates
      const start = new Date(reportData.startDate);
      const end = new Date(reportData.endDate);

      // Check if dates are valid
      if (isNaN(start.getTime())) {
        throw new Error("Invalid start date format");
      }

      if (isNaN(end.getTime())) {
        throw new Error("Invalid end date format");
      }

      if (end < start) {
        throw new Error("End date must be after start date");
      }

      const response = await api.post('/reports/stream', reportData, {
        responseType: 'blob'
      });
      
      // Check if the response is actually an error (JSON) despite requesting blob
      if (response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
        // Parse the blob as JSON to get the error message
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Failed to generate report');
      }
      
      return response.data;
    } catch (error: any) {
      console.error("Stream report error:", error);
      toast.error("Failed to generate report", {
        description: error.response?.data?.message || "Could not generate report. Please try again.",
      });
      throw error;
    }
  }
};

// Admin API
export const adminAPI = {
  getInsights: async (range: string = '30') => {
    try {
      const response = await api.get(`/admin/insights?range=${range}`);
      return response.data;
    } catch (error) {
      toast.error("Failed to load insights", {
        description: "Could not load analytics insights. Please try again.",
      });
      throw error;
    }
  },

  getAllUsers: async (role?: string, active?: string) => {
    try {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (active) params.append('active', active);

      const response = await api.get(`/admin/users?${params}`);
      return response.data;
    } catch (error) {
      toast.error("Failed to load users", {
        description: "Could not load users. Please try again.",
      });
      throw error;
    }
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    try {
      const response = await api.put(`/admin/users/${id}`, userData);
      toast.success("User updated", {
        description: "User has been updated successfully.",
      });
      return response.data;
    } catch (error) {
      toast.error("Failed to update user", {
        description: "Could not update user. Please try again.",
      });
      throw error;
    }
  },

  exportAttendance: async (from: string, to: string, userId?: string): Promise<Blob> => {
    try {
      const params = new URLSearchParams();
      params.append('from', from);
      params.append('to', to);
      if (userId) params.append('userId', userId);

      const response = await api.get(`/admin/export/attendance?${params}`, {
        responseType: 'blob'
      });
      toast.success("Attendance exported", {
        description: "Attendance data has been exported successfully.",
      });
      return response.data;
    } catch (error) {
      toast.error("Failed to export attendance", {
        description: "Could not export attendance data. Please try again.",
      });
      throw error;
    }
  },

};

// Holiday API
export const holidayAPI = {
  isHoliday: async (date: string) => {
    try {
      const response = await api.get(`/holidays/check?date=${date}`);
      return response.data;
    } catch (error) {
      toast.error("Failed to check holiday status", {
        description: "Could not check if date is a holiday. Please try again.",
      });
      throw error;
    }
  }
};

// Announcement API
export const announcementAPI = {
  getActiveAnnouncements: async () => {
    try {
      const response = await api.get('/announcements');
      return response.data;
    } catch (error) {
      toast.error("Failed to load announcements", {
        description: "Could not load announcements. Please try again.",
      });
      throw error;
    }
  },

  getAnnouncementById: async (id: string) => {
    try {
      const response = await api.get(`/announcements/${id}`);
      return response.data;
    } catch (error) {
      toast.error("Failed to load announcement", {
        description: "Could not load announcement. Please try again.",
      });
      throw error;
    }
  },

  createAnnouncement: async (data: { heading: string; description: string }) => {
    try {
      const response = await api.post('/announcements', data);
      toast.success("Announcement created", {
        description: "Announcement has been created successfully.",
      });
      return response.data;
    } catch (error: any) {
      toast.error("Failed to create announcement", {
        description: error.response?.data?.message || "Could not create announcement. Please try again.",
      });
      throw error;
    }
  },

  updateAnnouncement: async (id: string, data: { heading?: string; description?: string; isActive?: boolean }) => {
    try {
      const response = await api.put(`/announcements/${id}`, data);
      toast.success("Announcement updated", {
        description: "Announcement has been updated successfully.",
      });
      return response.data;
    } catch (error: any) {
      toast.error("Failed to update announcement", {
        description: error.response?.data?.message || "Could not update announcement. Please try again.",
      });
      throw error;
    }
  },

  deleteAnnouncement: async (id: string) => {
    try {
      const response = await api.delete(`/announcements/${id}`);
      toast.success("Announcement deleted", {
        description: "Announcement has been deleted successfully.",
      });
      return response.data;
    } catch (error: any) {
      toast.error("Failed to delete announcement", {
        description: error.response?.data?.message || "Could not delete announcement. Please try again.",
      });
      throw error;
    }
  }
};

// Branch API
export const branchAPI = {
  getBranches: async () => {
    try {
      const response = await api.get('/branches');
      return response.data;
    } catch (error) {
      toast.error("Failed to load branches", {
        description: "Could not load branches. Please try again.",
      });
      throw error;
    }
  },

  createBranch: async (branchData: {
    name: string;
    location: { lat: number; lng: number };
    radius?: number;
    isActive?: boolean;
  }) => {
    try {
      const response = await api.post('/branches', branchData);
      toast.success("Branch created", {
        description: "Branch has been created successfully.",
      });
      return response.data;
    } catch (error) {
      toast.error("Failed to create branch", {
        description: "Could not create branch. Please try again.",
      });
      throw error;
    }
  },

  updateBranch: async (id: string, branchData: {
    name?: string;
    location?: { lat: number; lng: number };
    radius?: number;
    isActive?: boolean;
  }) => {
    try {
      const response = await api.put(`/branches/${id}`, branchData);
      toast.success("Branch updated", {
        description: "Branch has been updated successfully.",
      });
      return response.data;
    } catch (error) {
      toast.error("Failed to update branch", {
        description: "Could not update branch. Please try again.",
      });
      throw error;
    }
  },

  deleteBranch: async (id: string) => {
    try {
      const response = await api.delete(`/branches/${id}`);
      toast.success("Branch deleted", {
        description: "Branch has been deleted successfully.",
      });
      return response.data;
    } catch (error) {
      toast.error("Failed to delete branch", {
        description: "Could not delete branch. Please try again.",
      });
      throw error;
    }
  }
};