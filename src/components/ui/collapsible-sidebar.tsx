import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  FileText,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
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
        icon: <Calendar className="h-4 w-4" />,
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
            className="fixed top-4 left-4 z-50 rounded-full md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
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
        className={`hidden md:block border-r bg-white fixed h-full transition-all duration-300 z-40 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Collapse toggle button */}
          <div className="flex items-center justify-between p-4 border-b">
            {!collapsed && (
              <div>
                <h2 className="text-xl font-bold">LRMC Staff</h2>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role === "director" ? "Director" : "Manager"}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="ml-auto"
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
        <div className="p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">LRMC Staff</h2>
            <p className="text-sm text-gray-500 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400">
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href) || isSubItemActive(item)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                }`}
                onClick={() => {
                  if (onClose) onClose();
                }}
              >
                {item.icon}
                {!collapsed && item.title}
              </Link>
              {!collapsed && item.subItems && (
                <ul className="ml-8 mt-1 space-y-1">
                  {item.subItems.map((subItem) => (
                    <li key={subItem.href}>
                      <Link
                        to={subItem.href}
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                          isActive(subItem.href)
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-primary"
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

      <div className="p-4 border-t mt-auto">
        <Button
          variant="outline"
          className={`w-full justify-start gap-3 ${
            collapsed ? "px-3" : "px-4"
          }`}
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
