import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";
import { authAPI } from "@/services/api";
import Login from "./pages/Login";

import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

// Employee pages
import EmployeeLayout from "./layouts/EmployeeLayout";
import EmployeeDashboard from "./pages/employee/Dashboard";
import ApplyLeave from "./pages/employee/ApplyLeave";
import Profile from "./pages/employee/Profile";
import Attendance from "./pages/employee/Attendance";
import History from "./pages/employee/History";

// Admin/Manager pages
import AdminManagerLayout from "./layouts/AdminManagerLayout";
import ManagerAttendance from "./pages/Manager/Attendance";
import ManagerReports from "./pages/Manager/Reports";
import ManagerProfile from "./pages/Manager/Profile";
import LeaveApprovals from "./pages/Manager/LeaveApprovals";
import AttendanceApprovals from "./pages/Manager/AttendanceApprovals";
import AddEmployee from "./pages/Manager/AddEmployee";
import ManagerHolidays from "./pages/Manager/Holidays"; // Added Holidays import
import BranchManagement from "./pages/Manager/BranchManagement"; // Added BranchManagement import

// Admin pages
import AdminAttendanceLogs from "./pages/AdminAttendanceLogs";

const queryClient = new QueryClient();

// Set dark theme by default
document.documentElement.classList.add("dark");

// Protected Route Component
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Employee Route Component
const EmployeeRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && user.role !== "employee") {
    // Redirect to appropriate dashboard based on role
    if (user.role === "manager") {
      return <Navigate to="/manager" replace />;
    } else if (user.role === "director") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && user.role !== "director") {
    // Redirect to appropriate dashboard based on role
    if (user.role === "manager") {
      return <Navigate to="/manager" replace />;
    } else if (user.role === "employee") {
      return <Navigate to="/employee/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Silent token validation on app load
  useEffect(() => {
    const validateToken = async () => {
      try {
        // If user is already authenticated, no need to validate
        if (isAuthenticated && user) {
          setIsLoading(false);
          return;
        }

        // Try to validate existing token
        const response = await authAPI.validateToken();
        if (response.success && response.data?.user) {
          login(response.data.user);
        }
      } catch (error) {
        // If token validation fails, ensure user is logged out
        logout();
        console.log("Token validation failed, user logged out");
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [isAuthenticated, user, login, logout]);

  // Check for authentication errors on app load
  useEffect(() => {
    // Check if there was an authentication error
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get("authError");

    if (authError) {
      // Clear auth state
      logout();
    }
  }, [logout]);

  // Show loading state while validating token
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark-blue">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Validating session...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-dark-blue text-foreground">
            <Routes>
              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Login />
                  )
                }
              />

              {/* Employee Routes with Layout */}
              <Route
                path="/employee"
                element={
                  <EmployeeRoute>
                    <EmployeeLayout />
                  </EmployeeRoute>
                }
              >
                <Route
                  index
                  element={<Navigate to="/employee/dashboard" replace />}
                />
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="apply-leave" element={<ApplyLeave />} />
                <Route path="profile" element={<Profile />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="history" element={<History />} />
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
              </Route>

              {/* Admin Routes */}
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
                          : user?.role === "manager"
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
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;