// User types
export interface User {
  _id: string;
  empId: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'director';
  managerId?: string;
  dob?: string; // Add DOB field
  officeLocation: {
    lat: number;
    lng: number;
    radius: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Attendance types
export interface AttendanceRecord {
  _id: string;
  userId: string | User;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  location: {
    checkIn?: { lat: number; lng: number };
    checkOut?: { lat: number; lng: number };
  };
  distanceFromOffice: {
    checkIn?: number;
    checkOut?: number;
  };
  status: 'present' | 'absent' | 'half-day' | 'on-leave' | 'outside-duty';
  workingHours: number;
  flagged: boolean;
  flaggedReason?: string;
  isHalfDay?: boolean;
  halfDayType?: 'morning' | 'afternoon';
  createdAt: string;
  updatedAt: string;
}

export interface FlaggedAttendanceRecord extends AttendanceRecord {
  flaggedReason: string;
}

// Activity types
export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userEmpId: string;
  action: 'checkin' | 'checkout';
  timestamp: string;
  location: { lat: number; lng: number } | null;
}

// Leave Request types
export interface LeaveRequest {
  _id: string;
  userId: User;
  startDate: string;
  endDate: string;
  reason: string;
  type: 'sick' | 'personal' | 'vacation' | 'emergency';
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: User;
  approvedAt?: string;
  rejectionReason?: string;
  days: number;
  isHalfDay?: boolean;
  halfDayType?: 'morning' | 'afternoon';
  isHalfDayStart?: boolean;
  isHalfDayEnd?: boolean;
  halfDayTypeStart?: 'morning' | 'afternoon';
  halfDayTypeEnd?: 'morning' | 'afternoon';
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown[];
}

// Registration data
export interface RegisterData {
  empId: string;
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'manager' | 'director';
  managerId?: string;
  dob?: string; // Add DOB field
  officeLocation?: {
    lat: number;
    lng: number;
    radius: number;
  };
}

// Leave request data
export interface LeaveRequestData {
  startDate: string;
  endDate: string;
  reason: string;
  type: 'sick' | 'personal' | 'vacation' | 'emergency';
  isHalfDay?: boolean;
  halfDayType?: 'morning' | 'afternoon';
  isHalfDayStart?: boolean;
  isHalfDayEnd?: boolean;
  halfDayTypeStart?: 'morning' | 'afternoon';
  halfDayTypeEnd?: 'morning' | 'afternoon';
}

// Error type
export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// Branch interface
export interface Branch {
  _id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  radius?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
