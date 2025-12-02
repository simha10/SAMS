import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Bell,
  Trash2,
  Cake,
  Navigation,
  Timer,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useBirthdayStore } from "@/stores/birthdayStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  attendanceAPI,
  leaveAPI,
  notificationsAPI,
  holidayAPI,
} from "@/services/api";
import { format } from "date-fns";
import type { AttendanceRecord, LeaveRequest, ApiError } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TodayStatus {
  date: string;
  attendance: AttendanceRecord;
}

interface GeofenceErrorData {
  distance: number;
  allowedRadius: number;
  flagged: boolean;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { birthdayMessage, showBirthdayBanner, hideBirthdayBanner } = useBirthdayStore();

  const {
    latitude,
    longitude,
    error: geoError,
    loading: geoLoading,
    getCurrentPosition,
  } = useGeolocation();

  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>(
    []
  );
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] =
    useState<"checkin" | "checkout" | null>(null);
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showGeofenceWarning, setShowGeofenceWarning] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);
  const [notificationErrorCount, setNotificationErrorCount] = useState(0); // Track notification errors

  useEffect(() => {
    let mounted = true;
    let notificationInterval: ReturnType<typeof setInterval>;

    const loadData = async () => {
      if (mounted) {
        await fetchTodayStatus();
      }

      // Add delay between requests to avoid rate limiting
      if (mounted) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await fetchRecentAttendance();
      }

      // Add delay between requests to avoid rate limiting
      if (mounted) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await fetchRecentLeaves();
      }

      // Add delay between requests to avoid rate limiting
      if (mounted) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await fetchRecentNotifications();
      }
    };

    loadData();

    // Set up periodic polling for notifications only (every 5 minutes)
    // But only if we haven't hit the error limit
    if (notificationErrorCount < 3) {
      notificationInterval = setInterval(() => {
        if (mounted) {
          fetchRecentNotifications();
        }
      }, 5 * 60 * 1000); // 5 minutes
    }

    // Check if there was a rate limit error in previous requests
    if (localStorage.getItem("rateLimitError") === "true") {
      setRateLimitError(true);
      // Clear the flag
      localStorage.removeItem("rateLimitError");
    }

    return () => {
      mounted = false;
      if (notificationInterval) {
        clearInterval(notificationInterval);
      }
    };
  }, [notificationErrorCount]);

  const fetchTodayStatus = async () => {
    try {
      const response = await attendanceAPI.getTodayStatus();
      if (response.success && response.data) {
        setTodayStatus(response.data);
      }
      setRateLimitError(false);
      // Clear rate limit error flag on success
      localStorage.removeItem("rateLimitError");
    } catch (err: unknown) {
      console.error("Failed to fetch today status:", err);
      // Check if it's a rate limit error
      const error = err as any;
      if (error.response?.status === 429) {
        setRateLimitError(true);
        toast.error("Too many requests", {
          description: "Please wait a moment and try again.",
        });
      }
    }
  };

  const fetchRecentAttendance = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7); // Last 7 days

      const response = await attendanceAPI.getMyAttendance(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );

      if (response.success && response.data) {
        setRecentAttendance(response.data.attendance);
      }
      setRateLimitError(false);
      // Clear rate limit error flag on success
      localStorage.removeItem("rateLimitError");
    } catch (err: unknown) {
      console.error("Failed to fetch attendance history:", err);
      // Check if it's a rate limit error
      const error = err as any;
      if (error.response?.status === 429) {
        setRateLimitError(true);
        toast.error("Too many requests", {
          description: "Please wait a moment and try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentLeaves = async () => {
    try {
      const response = await leaveAPI.getMyLeaveRequests();
      if (response.success && response.data) {
        setRecentLeaves(response.data.leaveRequests.slice(0, 5)); // Get last 5 leave requests
      }
      setRateLimitError(false);
      // Clear rate limit error flag on success
      localStorage.removeItem("rateLimitError");
    } catch (err: unknown) {
      console.error("Failed to fetch leave requests:", err);
      // Check if it's a rate limit error
      const error = err as any;
      if (error.response?.status === 429) {
        setRateLimitError(true);
        toast.error("Too many requests", {
          description: "Please wait a moment and try again.",
        });
      }
    }
  };

  // Add function to delete leave request
  const deleteLeaveRequest = async (id: string) => {
    try {
      const response = await leaveAPI.deleteLeaveRequest(id);
      if (response.success) {
        toast.success("Leave request deleted", {
          description: "Your leave request has been deleted successfully.",
        });
        // Refresh the leave requests list
        await fetchRecentLeaves();
      } else {
        toast.error("Failed to delete leave request", {
          description: response.message || "Please try again.",
        });
      }
    } catch (err: unknown) {
      toast.error("Failed to delete leave request", {
        description: "Please try again.",
      });
    }
  };

  const fetchRecentNotifications = async () => {
    // Implement fallback mechanism to prevent continuous reloading
    if (notificationErrorCount >= 3) {
      console.warn("Too many notification errors, using fallback data");
      setRecentNotifications([]); // Set to empty array to stop polling
      return;
    }

    try {
      const response = await notificationsAPI.getNotifications(10, 0); // Get last 10 notifications
      if (response.success && response.data) {
        setRecentNotifications(response.data.notifications.slice(0, 5)); // Get last 5 notifications
        // Reset error count on success
        setNotificationErrorCount(0);
      }
      setRateLimitError(false);
      // Clear rate limit error flag on success
      localStorage.removeItem("rateLimitError");
    } catch (err: unknown) {
      console.error("Failed to fetch notifications:", err);
      // Increment error count
      setNotificationErrorCount(prev => prev + 1);
      
      // Check if it's a rate limit error
      const error = err as any;
      if (error.response?.status === 429) {
        setRateLimitError(true);
        toast.error("Too many requests", {
          description: "Please wait a moment and try again.",
        });
      }
    }
  };

  const prepareAttendanceAction = async (action: "checkin" | "checkout") => {
    if (!latitude || !longitude) {
      setError("Location not available. Please enable location access.");
      return;
    }

    try {
      const position = await getCurrentPosition();
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setCoordinates(coords);

      // Check if today is a holiday
      const today = new Date().toISOString().split("T")[0];
      const holidayResponse = await holidayAPI.isHoliday(today);

      if (
        holidayResponse.success &&
        holidayResponse.data &&
        holidayResponse.data.isHoliday
      ) {
        // Today is a holiday - show holiday confirmation dialog
        setError(
          `You are trying to mark your attendance on a declared holiday (${holidayResponse.data.holiday.name}). This attendance will be flagged and will go for manager approval.`
        );
        setPendingAction(action);
        setShowGeofenceWarning(true); // Reuse the geofence warning dialog for holiday warning
        return;
      }

      // Instead of doing local geofence validation, proceed directly to confirmation
      // The backend will handle all geofence validation with the new multi-branch system
      setPendingAction(action);
      setShowConfirmation(true);
      setError(""); // Clear any previous error
    } catch (err) {
      setError("Failed to get current location");
    }
  };

  // New function to mark flagged attendance
  const markFlaggedAttendance = async (action: "checkin" | "checkout") => {
    if (!coordinates) {
      setError("Location not available. Please enable location access.");
      toast.error("Location not available", {
        description: "Please enable location access.",
      });
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      // Mark attendance as flagged regardless of location
      const response =
        action === "checkin"
          ? await attendanceAPI.checkin(coordinates.lat, coordinates.lng)
          : await attendanceAPI.checkout(coordinates.lat, coordinates.lng);

      if (response.success) {
        setMessage(
          action === "checkin"
            ? "Flagged check-in recorded successfully!"
            : "Flagged check-out recorded successfully!"
        );
        toast.success(
          action === "checkin"
            ? "Flagged check-in recorded"
            : "Flagged check-out recorded",
          {
            description:
              action === "checkin"
                ? "Your flagged check-in has been recorded successfully."
                : "Your flagged check-out has been recorded successfully.",
          }
        );
        // Refresh today's status after successful action
        await fetchTodayStatus();
        setShowGeofenceWarning(false);
        setRateLimitError(false);
      } else {
        setError(response.message || `${action} failed`);
        toast.error(
          action === "checkin" ? "Check-in failed" : "Check-out failed",
          {
            description: response.message || "Please try again.",
          }
        );
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(error.response?.data?.message || `${action} failed`);
      toast.error(
        action === "checkin" ? "Check-in failed" : "Check-out failed",
        {
          description: error.response?.data?.message || "Please try again.",
        }
      );
    } finally {
      setActionLoading(false);
    }
  };

  const executeAttendanceAction = async () => {
    if (!coordinates || !pendingAction) return;

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      const response =
        pendingAction === "checkin"
          ? await attendanceAPI.checkin(coordinates.lat, coordinates.lng)
          : await attendanceAPI.checkout(coordinates.lat, coordinates.lng);

      if (response.success) {
        setMessage(
          pendingAction === "checkin"
            ? "Check-in successful!"
            : "Check-out successful!"
        );
        toast.success(
          pendingAction === "checkin"
            ? "Check-in successful"
            : "Check-out successful",
          {
            description:
              pendingAction === "checkin"
                ? "You have been successfully checked in."
                : "You have been successfully checked out.",
          }
        );
        // Refresh today's status after successful action
        await fetchTodayStatus();
        setShowConfirmation(false);
        setPendingAction(null);
        setRateLimitError(false);
      } else {
        // Handle the case where the user is outside the geofence
        // Check if the response contains geofence error data
        if (
          "data" in response &&
          response.data &&
          typeof response.data === "object" &&
          "distance" in response.data &&
          "allowedRadius" in response.data
        ) {
          const geofenceData = response.data as GeofenceErrorData;
          setError(`You are ${geofenceData.distance}m away from the nearest branch. Your attendance will be flagged for manager review.`);
          setShowGeofenceWarning(true);
        } else {
          setError(response.message || `${pendingAction} failed`);
        }
        toast.error(
          pendingAction === "checkin" ? "Check-in failed" : "Check-out failed",
          {
            description: response.message || "Please try again.",
          }
        );
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      // Check if the error response contains geofence data
      if (
        error.response?.data &&
        typeof error.response.data === "object" &&
        "distance" in error.response.data &&
        "allowedRadius" in error.response.data
      ) {
        const geofenceData = error.response.data as GeofenceErrorData;
        setError(`You are ${geofenceData.distance}m away from the nearest branch. Your attendance will be flagged for manager review.`);
        setShowGeofenceWarning(true);
        toast.error("Geofence restriction", {
          description:
            error.response.data.message || "You are outside the allowed area.",
        });
      } else {
        setError(error.response?.data?.message || `${pendingAction} failed`);
        toast.error(
          pendingAction === "checkin" ? "Check-in failed" : "Check-out failed",
          {
            description: error.response?.data?.message || "Please try again.",
          }
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge variant="default" className="bg-emerald-500 text-emerald-50">
            <CheckCircle className="w-3 h-3 mr-1" />
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge variant="default" className="bg-rose-500 text-rose-50">
            <XCircle className="w-3 h-3 mr-1" />
            Absent
          </Badge>
        );
      case "half-day":
        return (
          <Badge variant="default" className="bg-amber-500 text-amber-50">
            <Clock className="w-3 h-3 mr-1" />
            Half Day
          </Badge>
        );
      case "on-leave":
        return (
          <Badge variant="default" className="bg-sky-500 text-sky-50">
            <Clock className="w-3 h-3 mr-1" />
            On Leave
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Add function to get status badge with appropriate colors
  const getLeaveStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="default" className="bg-amber-500 text-amber-50">
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="bg-emerald-500 text-emerald-50">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="default" className="bg-rose-500 text-rose-50">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isWithinOfficeHours = () => {
    const now = new Date();
    const hour = now.getHours();
    // Office hours: 9 AM to 8 PM
    return hour >= 9 && hour <= 20;
  };

  // Fixed logic for determining check-in/check-out eligibility
  const canCheckin = !todayStatus?.attendance?.checkInTime;
  const canCheckout =
    todayStatus?.attendance?.checkInTime &&
    !todayStatus?.attendance?.checkOutTime;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
      </div>

      {/* Rate Limit Error Message */}
      {rateLimitError && (
        <Alert variant="destructive" className="alert-modern">
          <AlertDescription>
            Too many requests sent to the server. Please wait a moment and try
            again. You may need to refresh the page after a minute.
          </AlertDescription>
        </Alert>
      )}

      {/* Birthday Banner */}
      {showBirthdayBanner && birthdayMessage && (
        <Alert className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0">
          <Cake className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{birthdayMessage}</span>
            <button 
              onClick={hideBirthdayBanner}
              className="ml-4 text-white hover:text-gray-200"
              aria-label="Close banner"
            >
              ×
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-primary/10 p-2 mr-3">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Status</p>
                <p className="font-bold">
                  {todayStatus?.attendance?.status === "present" ? "Present" : 
                   todayStatus?.attendance?.status === "absent" ? "Absent" : 
                   "Not Marked"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-primary/10 p-2 mr-3">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-bold">
                  {geoLoading ? "Loading..." : 
                   geoError ? "Error" : 
                   latitude && longitude ? "Available" : "Not Available"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Status */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Location Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {geoLoading ? (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting your location...
            </div>
          ) : geoError ? (
            <Alert variant="destructive" className="alert-modern">
              <AlertDescription>{geoError}</AlertDescription>
            </Alert>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>Latitude: {latitude?.toFixed(6)}</p>
              <p>Longitude: {longitude?.toFixed(6)}</p>
              <p className="mt-2 text-green-500">✓ Location access granted</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Status */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Today's Attendance
          </CardTitle>
          <CardDescription>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert className="alert-modern">
              <AlertDescription className="text-green-500">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {error && !showGeofenceWarning && (
            <Alert variant="destructive" className="alert-modern">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {todayStatus && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                {todayStatus.attendance ? (
                  getStatusBadge(todayStatus.attendance.status)
                ) : (
                  <Badge variant="secondary">No Record</Badge>
                )}
              </div>

              {todayStatus.attendance?.checkInTime && (
                <div className="flex items-center justify-between">
                  <span>Check-in:</span>
                  <span className="font-mono">
                    {format(
                      new Date(todayStatus.attendance.checkInTime),
                      "HH:mm:ss"
                    )}
                  </span>
                </div>
              )}

              {todayStatus.attendance?.checkOutTime && (
                <div className="flex items-center justify-between">
                  <span>Check-out:</span>
                  <span className="font-mono">
                    {format(
                      new Date(todayStatus.attendance.checkOutTime),
                      "HH:mm:ss"
                    )}
                  </span>
                </div>
              )}

              {todayStatus.attendance &&
                todayStatus.attendance.workingHours > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Working Hours:</span>
                    <span className="font-mono">
                      {Math.floor(todayStatus.attendance.workingHours / 60)}h{" "}
                      {todayStatus.attendance.workingHours % 60}m
                    </span>
                  </div>
                )}
            </div>
          )}

          <Separator />

          <div className="flex space-x-3">
            <Button
              onClick={() => prepareAttendanceAction("checkin")}
              disabled={
                !canCheckin ||
                actionLoading ||
                geoError !== null ||
                !isWithinOfficeHours()
              }
              className="flex-1 bg-green-500 border-2 border-white h-12"
            >
              {actionLoading && pendingAction === "checkin" && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Check In
            </Button>

            <Button
              onClick={() => prepareAttendanceAction("checkout")}
              variant="outline"
              disabled={!canCheckout || actionLoading || geoError !== null}
              className="flex-1 bg-red-400 border-2 border-white hover:bg-white hover:text-red-400 h-12"
            >
              {actionLoading && pendingAction === "checkout" && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Check Out
            </Button>
          </div>

          {!isWithinOfficeHours() && (
            <p className="text-sm text-amber-500 text-center">
              ⚠️ Outside office hours (9:00 AM - 8:00 PM)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Recent Attendance (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : recentAttendance.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No attendance records found
            </p>
          ) : (
            <div className="space-y-3">
              {recentAttendance.map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-secondary/50"
                >
                  <div>
                    <p className="font-medium">
                      {format(new Date(record.date), "MMM d, yyyy")}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {record.checkInTime && (
                        <span>
                          In: {format(new Date(record.checkInTime), "HH:mm")}
                        </span>
                      )}
                      {record.checkOutTime && (
                        <span>
                          Out: {format(new Date(record.checkOutTime), "HH:mm")}
                        </span>
                      )}
                      {record.workingHours && record.workingHours > 0 && (
                        <span>
                          Hours: {Math.floor(record.workingHours / 60)}h{" "}
                          {record.workingHours % 60}m
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(record.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Leaves */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-200" />
            Recent Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLeaves.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No leave requests found
            </p>
          ) : (
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div
                  key={leave._id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-secondary/50"
                >
                  <div>
                    <p className="font-medium">
                      {leave.type} - {leave.status}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>
                        From: {format(new Date(leave.startDate), "MMM d, yyyy")}
                      </span>
                      <span>
                        To: {format(new Date(leave.endDate), "MMM d, yyyy")}
                      </span>
                      <span>{leave.days} days</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getLeaveStatusBadge(leave.status)}
                    {leave.status === "pending" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteLeaveRequest(leave._id)}
                        className="btn-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentNotifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No notifications found
            </p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className="flex items-start p-3 border rounded-lg bg-secondary/50"
                >
                  <Bell className="w-4 h-4 mr-3 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(
                        new Date(notification.createdAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[425px] card-modern">
          <DialogHeader>
            <DialogTitle>
              {pendingAction === "checkin"
                ? "Confirm Check-in"
                : "Confirm Check-out"}
            </DialogTitle>
            <DialogDescription>
              Please confirm your attendance submission with the following
              details:
            </DialogDescription>
          </DialogHeader>

          {error && !showGeofenceWarning && (
            <Alert variant="destructive" className="alert-modern">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Time</span>
              </div>
              <p className="text-sm pl-6">
                {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>

            {coordinates && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Location</span>
                </div>
                <div className="text-sm pl-6 space-y-1">
                  <p>Latitude: {coordinates?.lat.toFixed(6)}</p>
                  <p>Longitude: {coordinates?.lng.toFixed(6)}</p>
                </div>
              </div>
            )}

            <div className="rounded-md bg-yellow-900/50 p-3">
              <p className="text-sm text-yellow-500">
                <strong>Important:</strong> By confirming, you agree that your
                location and time will be recorded for attendance purposes.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmation(false);
              }}
              disabled={actionLoading}
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={executeAttendanceAction}
              disabled={actionLoading}
              className="btn-primary"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Confirm Attendance"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Geofence Warning Dialog */}
      <Dialog open={showGeofenceWarning} onOpenChange={setShowGeofenceWarning}>
        <DialogContent className="sm:max-w-[425px] card-modern">
          <DialogHeader>
            <DialogTitle>Geofence Restriction</DialogTitle>
            <DialogDescription>
              You are outside the allowed office area.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="alert-modern">
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-orange-500">
                    ⚠️ {error}
                  </p>
                  <p className="text-sm text-orange-500">
                    Your attendance will be marked as "Outside Duty" and flagged
                    for manager review. Are you sure you want to proceed?
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowGeofenceWarning(false)}
              disabled={actionLoading}
              className="btn-secondary"
            >
              Close
            </Button>
            <Button
              onClick={() => markFlaggedAttendance(pendingAction || "checkin")}
              disabled={actionLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300 transform hover:scale-105"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : error && error.includes("holiday") ? (
                "Mark Holiday Attendance"
              ) : (
                "Mark Flagged Attendance"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}