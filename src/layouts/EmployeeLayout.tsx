import { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  User,
  Calendar,
  LogOut,
  Menu,
  FileText,
  Download,
  Inbox,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/authStore";
import { authAPI } from "@/services/api";
import type { ReactNode } from "react";
import { toast } from "@/components/ui/sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePWA } from "@/hooks/usePWA";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AnnouncementModal from "@/components/AnnouncementModal";
import { useAnnouncementModal } from "@/hooks/useAnnouncementModal";
import OfflineIndicator from "@/components/OfflineIndicator";

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
    title: "Apply_Leave",
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
    title: "Requests",
    href: "/employee/requests",
    icon: <Inbox className="h-5 w-5" />,
  },
  {
    title: "Announcements",
    href: "/employee/announcements",
    icon: <Bell className="h-5 w-5" />,
  },
];

export default function EmployeeLayout() {
  const [open, setOpen] = useState(false);
  const { logout, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { showInstallPrompt, installApp, isStandalone, isOnline } = usePWA();
  const { showModal, latestAnnouncement, checkForNewAnnouncements, closeModal } = useAnnouncementModal();

  // Check for new announcements when the app loads
  useEffect(() => {
    checkForNewAnnouncements();
  }, []);

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

  // Mobile bottom navigation
  const BottomNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 text-foreground">
      <div className="grid grid-cols-6 gap-1 p-2">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setOpen(false)}
          >
            {item.icon}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={showModal}
        onClose={closeModal}
        announcement={latestAnnouncement}
      />
      
      {/* Install Prompt */}
      {showInstallPrompt && !isStandalone && (
        <Alert className="bg-blue-500 text-white border-0 rounded-none">
          <AlertDescription className="flex items-center justify-between">
            <span>Install LRMC Staff app for better experience</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={installApp}
              className="h-8"
            >
              <Download className="h-4 w-4 mr-1" />
              Install
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Mobile header */}
      <header className="md:hidden bg-background border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 p-0 bg-gradient-to-b from-sidebar-background to-sidebar-accent text-sidebar-primary"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Employee Navigation</SheetTitle>
                <SheetDescription>
                  Navigation menu for employee dashboard sections
                </SheetDescription>
              </SheetHeader>
              <div className="flex h-full flex-col">
                <div className="p-4 border-b border-sidebar-border">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sidebar-primary-foreground">
                        {user?.name}
                      </p>
                      <p className="text-xs text-sidebar-foreground">
                        {user?.empId}
                      </p>
                    </div>
                  </div>
                </div>
                
                <nav className="flex-1 overflow-y-auto py-4">
                  <ul className="space-y-1 px-3">
                    {sidebarItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 border ${
                            isActive(item.href)
                              ? "bg-primary text-primary-foreground shadow-md border-blue-400"
                              : "text-sidebar-foreground border-transparent hover:border-orange-500"
                          }`}
                          onClick={() => {
                            setOpen(false);
                          }}
                        >
                          {item.icon}
                          <span>{item.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                
                <div className="p-4 border-t border-sidebar-border mt-auto">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 transition-all duration-300 border border-transparent hover:border-orange-500 bg-sidebar-accent text-sidebar-foreground border-sidebar-border"
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold text-foreground section-heading">
              LRMC Staff
            </h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-64 border-r border-border bg-background z-40 text-foreground">
        <div className="flex h-full flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.empId}</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {sidebarItems.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 border border-transparent ${
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground shadow-md border-blue-400"
                        : "text-foreground border-transparent hover:border-orange-500"
                    }`}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-border mt-auto">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 border border-transparent hover:border-orange-500"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 pb-16 md:pb-0 md:ml-64 pt-16 md:pt-0 bg-background text-foreground">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}