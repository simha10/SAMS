import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  FileText,
  BarChart3,
  User,
  LogOut,
  Menu,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/authStore";
import type { ReactNode } from "react";

interface SidebarItem {
  title: string;
  href: string;
  icon: ReactNode;
  subItems?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Attendance",
    href: "/manager/attendance",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Leave Approvals",
    href: "/manager/leave-approvals",
    icon: <CheckCircle className="h-5 w-5" />,
  },
  {
    title: "Attendance Approvals",
    href: "/manager/attendance-approvals",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    title: "Reports",
    href: "/manager/reports",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Analytics",
    href: "/manager/analytics",
    icon: <BarChart3 className="h-5 w-5" />,
    subItems: [
      {
        title: "Team Trends",
        href: "/manager/analytics/team",
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        title: "Employee Trends",
        href: "/manager/analytics/employee",
        icon: <Calendar className="h-4 w-4 text-blue-200" />,
      },
    ],
  },
  {
    title: "Profile",
    href: "/manager/profile",
    icon: <User className="h-5 w-5" />,
  },
];

interface CollapsibleSidebarProps {
  onLogout: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function CollapsibleSidebar({
  onLogout,
  collapsed: externalCollapsed,
  onCollapsedChange,
}: CollapsibleSidebarProps) {
  const [open, setOpen] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();

  const collapsed =
    externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const setCollapsed = (value: boolean) => {
    if (externalCollapsed !== undefined && onCollapsedChange) {
      onCollapsedChange(value);
    } else {
      setInternalCollapsed(value);
    }
  };

  // Load collapsed state from localStorage if not controlled externally
  useEffect(() => {
    if (externalCollapsed === undefined) {
      const savedCollapsed = localStorage.getItem("sidebarCollapsed");
      if (savedCollapsed) {
        setInternalCollapsed(JSON.parse(savedCollapsed));
      }
    }
  }, [externalCollapsed]);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const isSubItemActive = (item: SidebarItem) => {
    if (item.subItems) {
      return item.subItems.some((subItem) => isActive(subItem.href));
    }
    return false;
  };

  const toggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    window.dispatchEvent(
      new CustomEvent("sidebarToggle", { detail: { collapsed: newCollapsed } })
    );
  };

  return (
    <>
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
            logout={onLogout}
            isActive={isActive}
            isSubItemActive={isSubItemActive}
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
                <p className="text-xs text-sidebar-foreground truncate">
                  {user?.role === "director" ? "Director" : "Manager"}
                </p>
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
            logout={onLogout}
            isActive={isActive}
            isSubItemActive={isSubItemActive}
            user={user}
            collapsed={collapsed}
          />
        </div>
      </div>
    </>
  );
}

function SidebarContent({
  logout,
  isActive,
  isSubItemActive,
  user,
  onClose,
  collapsed = false,
}: {
  logout: () => void;
  isActive: (href: string) => boolean;
  isSubItemActive: (item: SidebarItem) => boolean;
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
              {user?.role === "director" ? "Director" : "Manager"} •{" "}
              {user?.empId}
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
                  isActive(item.href) || isSubItemActive(item)
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
              {!collapsed && item.subItems && (
                <ul className="ml-8 mt-1 space-y-1">
                  {item.subItems.map((subItem) => (
                    <li key={subItem.href}>
                      <Link
                        to={subItem.href}
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all duration-300 border border-transparent ${
                          isActive(subItem.href)
                            ? "bg-primary/20 text-primary font-semibold border-blue-400"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary hover:border-blue-400"
                        }`}
                        onClick={() => {
                          if (onClose) onClose();
                        }}
                      >
                        {subItem.icon}
                        {subItem.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
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
