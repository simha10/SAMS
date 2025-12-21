import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { ThemeProvider } from "next-themes";

// Lazy load components for better performance
import { lazy, Suspense } from "react";

// Import authAPI
import { authAPI } from "@/services/api";

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

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: ('employee' | 'manager' | 'director')[] 
}) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
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
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
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

const App = () => {
  const { isAuthenticated, user, login, logout } = useAuthStore();
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
            const response = await authAPI.validateToken();
            clearTimeout(timeoutId);
            
            if (response.success && response.data?.user) {
              login(response.data.user);
            } else {
              console.log("Token validation failed, logging out user");
              logout();
            }
          } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name !== 'AbortError') {
              console.error("Token validation error:", error);
              logout();
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
  }, []); // Empty dependency array - only run once on mount

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <ThemeProvider 
      defaultTheme="dark" 
      storageKey="vite-ui-theme"
      attribute="class"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
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
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;