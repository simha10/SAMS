import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";

// Lazy load components for better performance
import { lazy, Suspense } from "react";

// Import authAPI
import { authAPI } from "@/services/api";
import { useNetwork } from "@/contexts/NetworkContext";

// Employee Pages
const EmployeeDashboard = lazy(() => import("@/pages/employee/Dashboard"));
const EmployeeProfile = lazy(() => import("@/pages/employee/Profile"));
const Requests = lazy(() => import("@/pages/employee/Requests"));
const ApplyLeave = lazy(() => import("@/pages/employee/ApplyLeave"));
const Attendance = lazy(() => import("@/pages/employee/Attendance"));
import EmployeeAnnouncements from "@/pages/employee/Announcements"; // Add this import

// Manager Pages
const ManagerAttendance = lazy(() => import("@/pages/Manager/Attendance"));
const AddEmployee = lazy(() => import("@/pages/Manager/AddEmployee"));
const LeaveApprovals = lazy(() => import("@/pages/Manager/LeaveApprovals"));
const AttendanceApprovals = lazy(() => import("@/pages/Manager/AttendanceApprovals"));
const ManagerHolidays = lazy(() => import("@/pages/Manager/Holidays"));
const BranchManagement = lazy(() => import("@/pages/Manager/BranchManagement"));
const ManagerReports = lazy(() => import("@/pages/Manager/Reports"));
const ManagerProfile = lazy(() => import("@/pages/Manager/Profile"));
const ManagerAnnouncements = lazy(() => import("@/pages/Manager/Announcements"));

// Admin Pages
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminAttendanceLogs = lazy(() => import("@/pages/AdminAttendanceLogs"));

// Common Pages
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Layouts
const AdminManagerLayout = lazy(() => import("@/layouts/AdminManagerLayout"));
const EmployeeLayout = lazy(() => import("@/layouts/EmployeeLayout"));

// Protected Route Component
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: ('employee' | 'manager' | 'director')[] 
}) => {
  const { isAuthenticated, user, isLoading, isOfflineAuthenticated } = useAuthStore();
  const { isOnline } = useNetwork();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Check if user is authenticated (either online or offline)
  const isUserAuthenticated = (isAuthenticated && user) || (isOfflineAuthenticated && user);

  if (!isUserAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === "employee") {
      return <Navigate to="/employee/dashboard" replace />;
    } else if (user.role === "manager" || user.role === "director") {
      return <Navigate to="/manager" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component - This should only be accessible by system administrators
// Since we don't have an 'admin' role in our system, this route should not be accessible
// by regular users (employees, managers, directors)
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading, isOfflineAuthenticated } = useAuthStore();
  const { isOnline } = useNetwork();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Check if user is authenticated (either online or offline)
  const isUserAuthenticated = (isAuthenticated && user) || (isOfflineAuthenticated && user);

  if (!isUserAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Since there's no admin role in the system, nobody should be able to access this
  // Redirect all users to their respective dashboards
  if (user.role === "employee") {
    return <Navigate to="/employee/dashboard" replace />;
  } else if (user.role === "manager" || user.role === "director") {
    return <Navigate to="/manager" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

const AppContent = () => {
  const { isAuthenticated, user, login, logout, isOfflineAuthenticated, setIsOfflineAuthenticated } = useAuthStore();
  const { isOnline } = useNetwork();
  const [isLoading, setIsLoading] = useState(true);
  const hasValidatedRef = useRef(false);

  // Silent token validation on app load - only once
  useEffect(() => {
    // Prevent multiple validations
    if (hasValidatedRef.current) return;
    
    const validateToken = async () => {
      hasValidatedRef.current = true;
      
      try {
        // Only validate if we have user data in localStorage
        const authStorage = localStorage.getItem('auth-storage');
        if (!authStorage) {
          setIsLoading(false);
          return;
        }

        if (isAuthenticated && user) {
          console.log("Validating existing user session...");
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            const response = await authAPI.validateTokenWithCache(); // Use cached version
            clearTimeout(timeoutId);
            
            if (response.success && response.data?.user) {
              // Authentication successful, clear offline state
              login(response.data.user);
              setIsOfflineAuthenticated(false);
            } else {
              console.log("Token validation failed, logging out user");
              logout();
            }
          } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
              console.log('Token validation timed out');
            } else {
              // Check if this is a network error (not a 401/403)
              if (error.response?.status !== 401 && error.response?.status !== 403) {
                // This is likely a network error, not an auth failure
                console.log('Network error during validation, preserving auth state for offline use');
                setIsOfflineAuthenticated(true);
              } else {
                // This is an auth failure (401/403), clear auth state
                console.log("Token validation failed with auth error, logging out user");
                logout();
              }
            }
          }
        }
      } catch (error) {
        console.error("Token validation error:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []); // Only run once on mount

  // Handle online recovery - revalidate when network comes back
  useEffect(() => {
    if (isOnline && isOfflineAuthenticated && user) {
      console.log('Network restored, revalidating authentication...');
      
      const revalidateAuth = async () => {
        try {
          const response = await authAPI.validateToken();
          if (response.success && response.data?.user) {
            // Authentication still valid, update user and clear offline state
            login(response.data.user);
            setIsOfflineAuthenticated(false);
            console.log('Authentication revalidated successfully');
          } else {
            console.log('Authentication expired, logging out user');
            logout();
          }
        } catch (error: any) {
          if (error.response?.status === 401 || error.response?.status === 403) {
            // Auth failure, clear auth state
            console.log('Authentication invalid, logging out user');
            logout();
          } else {
            // Network error, keep offline state
            console.log('Network error during revalidation, keeping offline state');
            setIsOfflineAuthenticated(true);
          }
        }
      };
      
      revalidateAuth();
    }
  }, [isOnline, isOfflineAuthenticated, user, login, logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        }>
          <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate 
                  to={
                    user?.role === "employee" 
                      ? "/employee/dashboard" 
                      : user?.role === "manager" || user?.role === "director"
                      ? "/manager"
                      : "/admin"
                  } 
                  replace 
                />
              ) : (
                <Login />
              )
            } 
          />

          {/* Employee Routes with Layout */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="profile" element={<EmployeeProfile />} />
            <Route path="requests" element={<Requests />} />
            <Route path="apply-leave" element={<ApplyLeave />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="announcements" element={<EmployeeAnnouncements />} />{" "}
            {/* Added Announcements route */}
          </Route>

          {/* Manager/Director Routes with Layout */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={["manager", "director"]}>
                <AdminManagerLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<Navigate to="/manager/attendance" replace />}
            />
            <Route path="attendance" element={<ManagerAttendance />} />
            <Route path="add-employee" element={<AddEmployee />} />
            <Route path="leave-approvals" element={<LeaveApprovals />} />
            <Route
              path="attendance-approvals"
              element={<AttendanceApprovals />}
            />
            <Route path="holidays" element={<ManagerHolidays />} />{" "}
            {/* Added Holidays route */}
            <Route path="branches" element={<BranchManagement />} />{" "}
            {/* Added BranchManagement route */}
            <Route path="reports" element={<ManagerReports />} />
            <Route path="profile" element={<ManagerProfile />} />
            <Route path="announcements" element={<ManagerAnnouncements />} />{" "}
            {/* Added Announcements route */}
          </Route>

          {/* Admin Routes - Directors can also access these */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          >
            <Route
              index
              element={<Navigate to="/admin/insights" replace />}
            />
          </Route>

          <Route
            path="/admin/attendance-logs"
            element={
              <AdminRoute>
                <AdminAttendanceLogs />
              </AdminRoute>
            }
          />

          {/* Legacy Dashboard Route for backward compatibility */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {user?.role === "employee" ? (
                  <Navigate to="/employee/dashboard" replace />
                ) : (
                  <Navigate to="/manager/attendance" replace />
                )}
              </ProtectedRoute>
            }
          />

          {/* Root Route */}
          <Route
            path="/"
            element={
              <Navigate
                to={
                  isAuthenticated
                    ? user?.role === "employee"
                      ? "/employee/dashboard"
                      : user?.role === "manager" || user?.role === "director"
                      ? "/manager"
                      : "/admin"
                    : "/login"
                }
                replace
              />
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </div>
  );
};

export default AppContent;