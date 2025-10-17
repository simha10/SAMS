import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
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
import ManagerAnalytics from "./pages/Manager/Analytics";
import TeamTrends from "./pages/Manager/TeamTrends";
import EmployeeTrends from "./pages/Manager/EmployeeTrends";
import ManagerProfile from "./pages/Manager/Profile";
import LeaveApprovals from "./pages/Manager/LeaveApprovals";
// Admin pages
import AdminAttendanceLogs from "./pages/AdminAttendanceLogs";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { isAuthenticated, user } = useAuthStore();

  console.log("ProtectedRoute check:", { isAuthenticated, user, allowedRoles });

  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log("User role not allowed, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("Access granted to protected route");
  return <>{children}</>;
};

// Employee Route Component
const EmployeeRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();

  console.log("EmployeeRoute check:", { isAuthenticated, user });

  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (user && user.role !== "employee") {
    // Redirect to appropriate dashboard based on role
    if (user.role === "manager") {
      console.log("User is manager, redirecting to manager dashboard");
      return <Navigate to="/manager" replace />;
    } else if (user.role === "director") {
      console.log("User is director, redirecting to admin dashboard");
      return <Navigate to="/admin" replace />;
    }
    console.log("User role not recognized, redirecting to default dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("Access granted to employee route");
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
  const { isAuthenticated, user } = useAuthStore();

  console.log("App render:", { isAuthenticated, user });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
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
              <Route path="leave-approvals" element={<LeaveApprovals />} />
              <Route path="reports" element={<ManagerReports />} />
              <Route path="analytics" element={<ManagerAnalytics />} />
              <Route path="analytics/team" element={<TeamTrends />} />
              <Route path="analytics/employee" element={<EmployeeTrends />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
