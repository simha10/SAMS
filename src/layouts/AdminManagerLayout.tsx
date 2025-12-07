import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { authAPI } from "@/services/api";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";
import { toast } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* Fixed sidebar - always on left */}
      <div className="fixed left-0 top-0 h-full z-50">
        <CollapsibleSidebar
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Main content area - positioned to the right of sidebar */}
      <div 
        className={`flex flex-col flex-1 transition-all duration-300 overflow-y-auto ${
          sidebarCollapsed ? "md:ml-16 ml-0" : "md:ml-64 ml-0"
        }`}
      >
        {/* Header - sticky at top with proper spacing */}
        <header className="bg-background border-b border-border sticky top-0 z-40 w-full flex items-center justify-end px-4 py-4 sm:px-6">
          <div className="flex items-center space-x-4">
              
              <div className="text-right text-sm min-w-0">
                <p className="font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-muted-foreground truncate">
                  {user?.role === "director" ? "Director" : "Manager"} •{" "}
                  {user?.empId}
                </p>
              </div>
              <div className="flex items-center space-x-4 border-l border-border pl-4">
                <ThemeToggle />
              </div>
            </div>
        </header>
        
        {/* Page content - with proper padding to prevent overlap with header */}
        <main className="flex-1 pt-16 p-4 sm:p-6 bg-background text-foreground">
          <Outlet />
        </main>
      </div>
    </div>
  );
}