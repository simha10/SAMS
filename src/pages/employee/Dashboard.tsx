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
  Cake,
  Navigation,
  Timer,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAttendanceStore } from "@/stores/attendanceStore";
import { useBirthdayStore } from "@/stores/birthdayStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  attendanceAPI,
  holidayAPI,
} from "@/services/api";
import { format } from "date-fns";
import type { AttendanceRecord, ApiError } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";

// Import the attendance cache utilities
import { saveAttendanceToCache, loadAttendanceFromCache } from "@/utils/attendanceCache";

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
  const { todayAttendance, setTodayAttendance } = useAttendanceStore();

  const {
    latitude,
    longitude,
    error: geoError,
    loading: geoLoading,
    getCurrentPosition,
  } = useGeolocation();

  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  // Removed recentAttendance and recentLeaves state as per optimization requirements
  // const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  // const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  // const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  // Load cached attendance status immediately on component mount
  // This ensures UI renders immediately with cached data while fetching fresh data in background
  useEffect(() => {
    const loadInitialAttendanceStatus = async () => {
      // First, load cached data for immediate UI rendering
      const cachedStatus = loadAttendanceFromCache();
      if (cachedStatus) {
        console.log("Loaded attendance status from cache");
        const todayStatusData = {
          date: cachedStatus.date,
          attendance: cachedStatus.attendance
        };
        setTodayStatus(todayStatusData);
        // Sync with attendance store
        setTodayAttendance(todayStatusData);
      }
      
      // Then fetch fresh data in background to update UI
      try {
        await fetchTodayStatus();
      } catch (error) {
        console.error("Failed to fetch fresh attendance status:", error);
        // Keep using cached data if fetch fails
      }
    };
    
    loadInitialAttendanceStatus();
  }, []);

  // Detect date changes and automatically refresh attendance status
  useEffect(() => {
    const checkDateChange = () => {
      const today = new Date().toISOString().split('T')[0];
      const cachedStatus = loadAttendanceFromCache();
      
      // If cached data is from a different date, clear cache and fetch fresh data
      if (cachedStatus && cachedStatus.date !== today) {
        console.log("Date changed, clearing cache and refreshing attendance status");
        // Clear the cache
        localStorage.removeItem('attendance_status_cache');
        // Clear attendance store
        setTodayAttendance(null);
        // Fetch fresh data
        fetchTodayStatus();
      }
    };

    // Check for date change when component mounts
    checkDateChange();

    // Set up interval to check for date changes every minute
    const intervalId = setInterval(checkDateChange, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Removed auto-fetch on component mount as per optimization requirements
  // Data will only be fetched when user explicitly clicks refresh button

  // Remove auto-fetch useEffect and replace with manual refresh
  // Optimized to only fetch essential data (today's attendance status)
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTodayStatus();
      setRateLimitError(false);
      // Clear rate limit error flag on success
      localStorage.removeItem("rateLimitError");
    } catch (err) {
      console.error("Failed to refresh data:", err);
      // Check if it's a rate limit error
      const error = err as any;
      if (error.response?.status === 429) {
        setRateLimitError(true);
        toast.error("Too many requests", {
          description: "Please wait a moment and try again.",
        });
      }
    } finally {
      setRefreshing(false);
    }
  };

  const fetchTodayStatus = async () => {
    try {
      const response = await attendanceAPI.getTodayStatus();
      if (response.success && response.data) {
        setTodayStatus(response.data);
        // Sync with attendance store
        setTodayAttendance(response.data);
        // Save to cache for immediate load on next visit
        saveAttendanceToCache(response.data.attendance);
      } else {
        // If response is not successful, clear the current status
        setTodayStatus(null);
        // Clear attendance store as well
        setTodayAttendance(null);
        // Clear cache as well
        localStorage.removeItem('attendance_status_cache');
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
      } else {
        // For other errors, clear the current status to avoid showing stale data
        setTodayStatus(null);
        // Clear attendance store as well
        setTodayAttendance(null);
        // Clear cache as well
        localStorage.removeItem('attendance_status_cache');
      }
    }
  };

  const prepareAttendanceAction = async (action: "checkin" | "checkout") => {
    // Clear any previous messages when starting a new action
    setMessage("");
    setError("");
    
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
        // Add a small delay to ensure database is updated
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchTodayStatus();
        // Also refresh recent attendance to show the latest record
        // Removed as per optimization requirements - attendance only fetched on explicit user action
        setShowGeofenceWarning(false);        setRateLimitError(false);
              
        // Clear success message after 5 seconds
        setTimeout(() => {
          setMessage("");
        }, 5000);
      } else {
        const errorMessage = response.message || `${action} failed`;
        setError(errorMessage);
        // If backend says already checked in/out, refresh the UI to show current state
        if (errorMessage?.includes("Already checked")) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await fetchTodayStatus();
        }
        toast.error(
          action === "checkin" ? "Check-in failed" : "Check-out failed",
          {
            description: errorMessage || "Please try again.",
          }
        );
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      const errorMessage = error.response?.data?.message || `${action} failed`;
      setError(errorMessage);
      // If backend says already checked in/out, refresh the UI to show current state
      if (errorMessage?.includes("Already checked")) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchTodayStatus();
      }
      toast.error(
        action === "checkin" ? "Check-in failed" : "Check-out failed",
        {
          description: errorMessage || "Please try again.",
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
        // Add a small delay to ensure database is updated
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchTodayStatus();
        // Also refresh recent attendance to show the latest record
        // Removed as per optimization requirements - attendance only fetched on explicit user action
        setShowConfirmation(false);
        setPendingAction(null);
        setRateLimitError(false);              
        // Clear success message after 5 seconds
        setTimeout(() => {
          setMessage("");
        }, 5000);
      } else {
        const errorMessage = response.message || `${pendingAction} failed`;
        setError(errorMessage);
        // If backend says already checked in/out, refresh the UI to show current state
        if (errorMessage?.includes("Already checked")) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await fetchTodayStatus();
        }
        // Handle the case where the user is outside the geofence
        // Check if the response contains geofence error data
        else if (
          "data" in response &&
          response.data &&
          typeof response.data === "object" &&
          "distance" in response.data &&
          "allowedRadius" in response.data
        ) {
          const geofenceData = response.data as GeofenceErrorData;
          setError(`You are ${geofenceData.distance}m away from the nearest branch. Your attendance will be flagged for manager review.`);
          setShowGeofenceWarning(true);
        }
        toast.error(
          pendingAction === "checkin" ? "Check-in failed" : "Check-out failed",
          {
            description: errorMessage || "Please try again.",
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
        const errorMessage = error.response?.data?.message || `${pendingAction} failed`;
        setError(errorMessage);
        // If backend says already checked in/out, refresh the UI to show current state
        if (errorMessage?.includes("Already checked")) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await fetchTodayStatus();
        }
        toast.error(
          pendingAction === "checkin" ? "Check-in failed" : "Check-out failed",
          {
            description: errorMessage || "Please try again.",
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

  const isWithinOfficeHours = () => {
    const now = new Date();
    const hour = now.getHours();
    // Office hours: 9 AM to 8 PM
    return hour >= 9 && hour <= 20;
  };

  // Improved logic for determining check-in/check-out eligibility
  // Ensure button states are strictly based on backend data
  const canCheckin = todayStatus?.attendance ? !todayStatus.attendance.checkInTime : true;
  const canCheckout = todayStatus?.attendance 
    ? todayStatus.attendance.checkInTime && !todayStatus.attendance.checkOutTime
    : false;
    
  // Ensure buttons are properly disabled when data is loading or unavailable
  const isDataLoading = todayStatus === null && !error;
    
  // Enhanced button state logic with better visual feedback
  const getCheckInButtonClass = () => {
    if (actionLoading && pendingAction === "checkin") {
      return "flex-1 h-12 bg-green-500 hover:bg-green-600";
    }
    if (canCheckin) {
      return "flex-1 h-12 bg-green-500 hover:bg-green-600 border-2 border-white";
    }
    return "flex-1 h-12 bg-gray-400 cursor-not-allowed border-2 border-white";
  };
  
  const getCheckOutButtonClass = () => {
    if (actionLoading && pendingAction === "checkout") {
      return "flex-1 h-12 bg-red-500 hover:bg-red-600 text-white";
    }
    if (canCheckout) {
      return "flex-1 h-12 bg-red-500 hover:bg-red-600 text-white border-2 border-white";
    }
    return "flex-1 h-12 bg-gray-400 text-gray-700 cursor-not-allowed border-2 border-gray-400";
  };
  // Debug logging to help troubleshoot button states
  useEffect(() => {
    console.log('Today status updated:', todayStatus);
    console.log('Can checkin:', canCheckin);
    console.log('Can checkout:', canCheckout);
    if (todayStatus?.attendance) {
      console.log('Attendance details:', {
        checkInTime: todayStatus.attendance.checkInTime,
        checkOutTime: todayStatus.attendance.checkOutTime,
        status: todayStatus.attendance.status
      });
    }
  }, [todayStatus, canCheckin, canCheckout]);  
  // Removed aggressive visibility change handler as per optimization requirements
  // Data will only be fetched when user explicitly clicks refresh button
  /*
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Check if we have fresh cached data (less than 5 minutes old)
        const cachedStatus = loadAttendanceFromCache();
        if (cachedStatus) {
          const cacheAge = Date.now() - cachedStatus.timestamp;
          // Only refresh if cache is older than 5 minutes
          if (cacheAge > 5 * 60 * 1000) {
            handleRefresh();
          }
        } else {
          // No cache, refresh data
          handleRefresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  */
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="bg-orange-500 hover:bg-orange-600">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
                  {todayStatus?.attendance ? (
                    todayStatus.attendance.checkOutTime ? (
                      <span className="text-green-500">Checked Out</span>
                    ) : todayStatus.attendance.checkInTime ? (
                      <span className="text-blue-500">Checked In</span>
                    ) : (
                      <span>Not Marked</span>
                    )
                  ) : (
                    "Not Marked"
                  )}
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Today's Attendance
            </div>
            <Button variant="outline" size="sm" onClick={fetchTodayStatus} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
          <CardDescription>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert className="alert-modern bg-green-50 border-green-200">
              <AlertDescription className="text-green-700 font-medium">
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
              
              {/* Visual indicator for checkout status */}
              {todayStatus?.attendance?.checkOutTime && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="font-medium">Checkout Status:</span>
                  <Badge variant="default" className="bg-green-500 text-green-50">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>
              )}
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
                !isWithinOfficeHours() ||
                isDataLoading
              }
              className={getCheckInButtonClass()}
            >
              {(actionLoading && pendingAction === "checkin") || isDataLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {isDataLoading ? "Loading..." : "Check In"}
            </Button>

            <Button
              onClick={() => prepareAttendanceAction("checkout")}
              disabled={!canCheckout || actionLoading || geoError !== null || isDataLoading}
              className={getCheckOutButtonClass()}
            >
              {(actionLoading && pendingAction === "checkout") || isDataLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {isDataLoading ? "Loading..." : "Check Out"}
            </Button>
          </div>
          {!isWithinOfficeHours() && (
            <p className="text-sm text-amber-500 text-center">
              ⚠️ Outside office hours (9:00 AM - 8:00 PM)
            </p>
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