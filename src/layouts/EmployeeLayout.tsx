import { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  Home,
  User,
  Calendar,
  History,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/authStore";
import { authAPI } from "@/services/api";
import type { ReactNode } from "react";
import { toast } from "@/components/ui/sonner";

interface SidebarItem {
  title: string;
  href: string;
  icon: ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/employee/dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Apply Leave",
    href: "/employee/apply-leave",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Profile",
    href: "/employee/profile",
    icon: <User className="h-5 w-5" />,
  },
  {
    title: "Attendance",
    href: "/employee/attendance",
    icon: <Calendar className="h-5 w-5 text-blue-200" />,
  },
  {
    title: "History",
    href: "/employee/history",
    icon: <History className="h-5 w-5" />,
  },
];

export default function EmployeeLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuthStore();
  const location = useLocation();

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("employeeSidebarCollapsed");
    if (savedCollapsed) {
      setCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("employeeSidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      toast.success("Logged out successfully", {
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      logout(); // Logout locally even if server request fails
      toast.success("Logged out successfully", {
        description: "You have been successfully logged out.",
      });
    }
  };

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar trigger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 left-4 z-50 rounded-full md:hidden bg-primary text-primary-foreground hover:bg-primary/90 hover:border-blue-400 border border-transparent transition-all duration-300"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-gradient-to-b from-sidebar-background to-sidebar-accent"
        >
          <SidebarContent
            logout={handleLogout}
            isActive={isActive}
            user={user}
            onClose={() => setOpen(false)}
            collapsed={false}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div
        className={`hidden md:block border-r border-sidebar-border bg-gradient-to-b from-sidebar-background to-sidebar-accent fixed h-full transition-all duration-300 z-40 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Collapse toggle button */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            {!collapsed && (
              <div>
                <h2 className="text-xl font-bold text-sidebar-primary">
                  LRMC Staff
                </h2>
                <p className="text-xs text-sidebar-foreground">Employee</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary hover:border-blue-400 border border-transparent transition-all duration-300"
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
          </div>

          <SidebarContent
            logout={handleLogout}
            isActive={isActive}
            user={user}
            collapsed={collapsed}
          />
        </div>
      </div>

      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        <header className="bg-background border-b border-border sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-2">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:border-blue-400 border border-transparent transition-all duration-300"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle sidebar</span>
                  </Button>
                </SheetTrigger>
              </Sheet>
              <h1 className="text-xl font-semibold text-foreground">
                Attendance System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm">
                <p className="font-medium text-foreground">{user?.name}</p>
                <p className="text-muted-foreground">{user?.empId}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  logout,
  isActive,
  user,
  onClose,
  collapsed = false,
}: {
  logout: () => void;
  isActive: (href: string) => boolean;
  user: any;
  onClose?: () => void;
  collapsed?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      {!collapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <div>
            <h2 className="text-xl font-bold text-sidebar-primary">
              LRMC Staff
            </h2>
            <p className="text-sm text-sidebar-foreground truncate">
              {user?.name}
            </p>
            <p className="text-xs text-sidebar-muted">
              Employee ID: {user?.empId}
            </p>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {sidebarItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 border border-transparent ${
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-md border-blue-400"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary hover:shadow-sm hover:border-blue-400"
                }`}
                onClick={() => {
                  if (onClose) onClose();
                }}
              >
                {item.icon}
                {!collapsed && <span className="flex-1">{item.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border mt-auto">
        <Button
          variant="outline"
          className={`w-full justify-start gap-3 transition-all duration-300 border border-transparent hover:border-blue-400 ${
            collapsed ? "px-3" : "px-4"
          } bg-sidebar-accent text-sidebar-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-md border-sidebar-border`}
          onClick={() => {
            logout();
            if (onClose) onClose();
          }}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
}
