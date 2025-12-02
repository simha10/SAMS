import axios from 'axios';
import type { User, AttendanceRecord, LeaveRequest, ApiResponse, RegisterData, LeaveRequestData, } from '@/types';
import { toast } from '@/components/ui/sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Create axios instance with default config
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // Important for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("=== API RESPONSE ===");
    console.log("Status:", response.status);
    console.log("URL:", response.config.url);
    console.log("Response data:", response.data);
    console.log("Timestamp:", new Date().toISOString());
    console.log("=== END API RESPONSE ===");
    return response;
  },
  async (error) => {
    console.error("=== API RESPONSE ERROR ===");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);
    console.error("Config:", error.config);
    console.error("Request:", error.request);
    console.error("Timestamp:", new Date().toISOString());

    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      console.log("RATE LIMIT EXCEEDED - Setting error flag");
      // Set a flag in localStorage to indicate rate limit error
      localStorage.setItem('rateLimitError', 'true');
      // Don't retry on rate limit to prevent infinite loop
      console.log("=== END API RESPONSE ERROR ===");
      toast.error("Too many requests", {
        description: "Please wait a moment and try again.",
      });
      return Promise.reject(error);
    }

    // Handle authentication errors (401)
    if (error.response?.status === 401) {
      console.log("AUTHENTICATION ERROR - Redirecting to login");
      console.log("Error message:", error.response?.data?.message);

      // Check if it's a token/user not found error
      if (error.response?.data?.message?.includes('user not found')) {
        console.log("User not found in database - clearing auth state");
        // Clear auth state
        localStorage.removeItem('auth-storage');
        sessionStorage.removeItem('auth-storage');
      }

      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        console.log("Redirecting to login page");
        window.location.href = '/login';
        toast.error("Session expired", {
          description: "Please log in again to continue.",
        });
      }
    }

    if (error.response?.status === 403) {
      console.log("FORBIDDEN ACCESS - Possible authentication issue");
      console.log("Error message:", error.response?.data?.message);
      toast.error("Access denied", {
        description: "You don't have permission to perform this action.",
      });
      // Don't redirect automatically for 403, let the component handle it
    }

    console.log("=== END API RESPONSE ERROR ===");
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (empId: string, password: string, rememberMe: boolean = false): Promise<ApiResponse<{ user: User }>> => {
    console.log("Calling login API with:", { empId, password, rememberMe });
    try {
      const response = await api.post('/auth/login', { empId, password, rememberMe });
      console.log("Login API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Login API error:", error);
      throw error;
    }
  },

  logout: async (): Promise<ApiResponse> => {
    try {
      const response = await api.post('/auth/logout');
      toast.success("Logged out", {
        description: "You have been successfully logged out.",
      });
      return response.data;
    } catch (error) {
      toast.error("Logout failed", {
        description: "Could not log out. Please try again.",
      });
      throw error;
    }
  },

  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (userData: { name?: string; email?: string }): Promise<ApiResponse<{ user: User }>> => {
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
  checkin: async (lat: number, lng: number): Promise<ApiResponse<{ checkInTime: string; distance: number; status: string } | GeofenceErrorData>> => {
    try {
      const response = await api.post('/attendance/checkin', { lat, lng });
      return response.data;
    } catch (error) {
      toast.error("Check-in failed", {
        description: "Could not complete check-in. Please try again.",
      });
      throw error;
    }
  },

  checkout: async (lat: number, lng: number): Promise<ApiResponse<{ checkOutTime: string; distance: number; workingHours: number } | GeofenceErrorData>> => {
    try {
      const response = await api.post('/attendance/checkout', { lat, lng });
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
  // New streaming report function
  streamReport: async (reportData: {
    type: string;
    format?: string;
    startDate: string;
    endDate: string;
    filters?: Record<string, any>;
  }): Promise<Blob> => {
    try {
      const response = await api.post('/reports/stream', reportData, {
        responseType: 'blob'
      });
      toast.success("Report downloaded", {
        description: "Your report has been downloaded successfully.",
      });
      return response.data;
    } catch (error) {
      toast.error("Failed to download report", {
        description: "Could not download report. Please try again.",
      });
      throw error;
    }
  },

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

// Notifications API
export const notificationsAPI = {
  getNotifications: async (limit: number = 20, skip: number = 0) => {
    try {
      const response = await api.get(`/notifications?limit=${limit}&skip=${skip}`);
      return response.data;
    } catch (error: any) {
      // Check if it's a network error or server error
      if (!error.response) {
        // Network error - return fallback data
        console.warn("Network error fetching notifications, returning fallback data");
        return {
          success: true,
          data: {
            notifications: [],
            total: 0
          },
          message: "Using fallback data due to network issues"
        };
      }

      // Check if it's a 404 or other client error
      if (error.response.status === 404) {
        // No notifications endpoint or no data - return empty but successful response
        return {
          success: true,
          data: {
            notifications: [],
            total: 0
          },
          message: "No notifications found"
        };
      }

      // For other errors, still provide fallback but log the error
      console.error("Failed to load notifications:", error);
      toast.error("Failed to load notifications", {
        description: "Could not load notifications. Please try again.",
      });

      // Return fallback data to prevent continuous reloading
      return {
        success: true,
        data: {
          notifications: [],
          total: 0
        },
        message: "Using fallback data due to server issues"
      };
    }
  }
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
