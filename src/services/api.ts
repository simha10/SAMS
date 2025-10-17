import axios from 'axios';
import type { User, AttendanceRecord, LeaveRequest, ApiResponse, RegisterData, LeaveRequestData, ApiError } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
const minRequestInterval = 200; // Minimum time between requests in ms

api.interceptors.request.use(
  async (config) => {
    console.log("API Request:", config.method?.toUpperCase(), config.url, config.data);
    
    // Ensure credentials are included
    config.withCredentials = true;
    
    // Add delay between requests to prevent rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, minRequestInterval - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();
    
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.config.url, response.data);
    return response;
  },
  async (error) => {
    console.error("API Response Error:", error.response?.status, error.response?.data, error.message);
    console.error("Error config:", error.config);
    console.error("Error request:", error.request);
    
    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      console.log("Rate limit exceeded, not retrying to prevent infinite loop");
      // Don't retry on rate limit to prevent infinite loop
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      console.log("Unauthorized access, redirecting to login");
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      console.log("Forbidden access - possible authentication issue");
      // Don't redirect automatically for 403, let the component handle it
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (empId: string, password: string): Promise<ApiResponse<{ user: User }>> => {
    console.log("Calling login API with:", { empId, password });
    try {
      const response = await api.post('/auth/login', { empId, password });
      console.log("Login API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Login API error:", error);
      throw error;
    }
  },
  
  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  register: async (userData: RegisterData): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }
};

// Extended API response types for attendance with geofence data
interface GeofenceErrorData {
  distance: number;
  allowedRadius: number;
  flagged: boolean;
}

// Attendance API
export const attendanceAPI = {
  checkin: async (lat: number, lng: number): Promise<ApiResponse<{ checkInTime: string; distance: number; status: string } | GeofenceErrorData>> => {
    const response = await api.post('/attendance/checkin', { lat, lng });
    return response.data;
  },
  
  checkout: async (lat: number, lng: number): Promise<ApiResponse<{ checkOutTime: string; distance: number; workingHours: number } | GeofenceErrorData>> => {
    const response = await api.post('/attendance/checkout', { lat, lng });
    return response.data;
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
    const response = await api.post('/leaves', leaveData);
    return response.data;
  },
  
  getMyLeaveRequests: async (): Promise<ApiResponse<{ leaveRequests: LeaveRequest[]; total: number }>> => {
    const response = await api.get('/leaves/me');
    return response.data;
  },
  
  cancelLeaveRequest: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/leaves/${id}`);
    return response.data;
  }
};

// Manager API
export const managerAPI = {
  getTeamAttendance: async (date: string): Promise<ApiResponse<{
    date: string;
    team: Array<{
      employee: { id: string; empId: string; name: string; email: string };
      attendance: {
        status: string;
        checkInTime: string | null;
        checkOutTime: string | null;
        workingHours: number | null;
        location: {
          checkIn: { lat: number; lng: number } | null;
          checkOut: { lat: number; lng: number } | null;
        } | null;
        distanceFromOffice: {
          checkIn: number | null;
          checkOut: number | null;
        } | null;
        flagged: boolean;
      };
    }>;
    summary: { total: number; present: number; absent: number; flagged: number; onLeave: number };
  }>> => {
    const response = await api.get(`/manager/team/attendance?date=${date}`);
    return response.data;
  },
  
  getFlaggedAttendance: async (from?: string, to?: string): Promise<ApiResponse<{ flaggedRecords: AttendanceRecord[]; total: number }>> => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    const response = await api.get(`/manager/team/flagged?${params}`);
    return response.data;
  },
  
  getTeamLeaveRequests: async (): Promise<ApiResponse<{ leaveRequests: LeaveRequest[]; total: number }>> => {
    const response = await api.get('/manager/team/leaves');
    return response.data;
  },
  
  updateLeaveRequest: async (id: string, status: string, rejectionReason?: string): Promise<ApiResponse<{ leaveRequest: LeaveRequest }>> => {
    const response = await api.put(`/manager/leaves/${id}`, { 
      status, 
      rejectionReason 
    });
    return response.data;
  },
  
  getRecentActivities: async (period: string): Promise<ApiResponse<{ 
    activities: Array<{
      id: string;
      userId: string;
      userName: string;
      userEmpId: string;
      action: string;
      timestamp: string;
      location: { lat: number; lng: number } | null;
    }>; 
    total: number 
  }>> => {
    const response = await api.get(`/manager/team/activities?period=${period}`);
    return response.data;
  }
};

// Report API
export const reportAPI = {
  generateReport: async (reportData: {
    title: string;
    type: string;
    format?: string;
    startDate: string;
    endDate: string;
    filters?: Record<string, any>;
  }): Promise<ApiResponse<{ report: any }>> => {
    const response = await api.post('/reports', reportData);
    return response.data;
  },

  getMyReports: async (type?: string): Promise<ApiResponse<{ reports: any[]; total: number }>> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    
    const response = await api.get(`/reports/my?${params}`);
    return response.data;
  },

  downloadReport: async (id: string): Promise<Blob> => {
    const response = await api.get(`/reports/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// Admin API
export const adminAPI = {
  getInsights: async (range: string = '30'): Promise<ApiResponse<{
    period: { startDate: string; endDate: string; days: number };
    overview: { totalEmployees: number; overallAttendanceRate: number; totalAttendanceRecords: number };
    attendanceStats: Record<string, number>;
    dailyTrends: Array<{ _id: string; present: number; absent: number; flagged: number }>;
    topPerformers: Array<{ empId: string; name: string; attendanceRate: number; presentDays: number; totalDays: number }>;
  }>> => {
    const response = await api.get(`/admin/insights?range=${range}`);
    return response.data;
  },
  
  getAllUsers: async (role?: string, active?: string): Promise<ApiResponse<{ users: User[]; total: number }>> => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (active) params.append('active', active);
    
    const response = await api.get(`/admin/users?${params}`);
    return response.data;
  },
  
  updateUser: async (id: string, userData: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },
  
  exportAttendance: async (from: string, to: string, userId?: string): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('from', from);
    params.append('to', to);
    if (userId) params.append('userId', userId);
    
    const response = await api.get(`/admin/export/attendance?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

};

// Notifications API
export const notificationsAPI = {
  getNotifications: async (limit: number = 20, skip: number = 0): Promise<ApiResponse<{ notifications: unknown[]; total: number }>> => {
    const response = await api.get(`/notifications?limit=${limit}&skip=${skip}`);
    return response.data;
  }
};