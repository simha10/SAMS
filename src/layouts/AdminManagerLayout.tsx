import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { authAPI } from "@/services/api";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";
import { toast } from "@/components/ui/sonner";

export default function AdminManagerLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed) {
      setSidebarCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Listen for sidebar collapse changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCollapsed = localStorage.getItem("sidebarCollapsed");
      if (savedCollapsed) {
        setSidebarCollapsed(JSON.parse(savedCollapsed));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      navigate("/login");
      toast.success("Logged out successfully", {
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      logout(); // Logout locally even if server request fails
      navigate("/login");
      toast.success("Logged out successfully", {
        description: "You have been successfully logged out.",
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      <CollapsibleSidebar
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        <header className="bg-background border-b border-border sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-foreground">
                Manager Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm">
                <p className="font-medium text-foreground">{user?.name}</p>
                <p className="text-muted-foreground">
                  {user?.role === "director" ? "Director" : "Manager"} •{" "}
                  {user?.empId}
                </p>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
