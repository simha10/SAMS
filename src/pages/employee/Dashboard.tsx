import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Alert, 
  AlertDescription 
} from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Loader2, 
  MapPin, 
  Navigation, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Calendar as CalendarIcon,
  RefreshCw,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useBranches } from "@/hooks/useBranches";
import { useAuthStore } from "@/stores/authStore";
import { useAttendanceStore } from "@/stores/attendanceStore";
import { useBirthdayStore } from "@/stores/birthdayStore";
import { attendanceAPI } from "@/services/api";
import { calculateDistance } from "@/utils/haversine";
import type { AttendanceRecord, ApiError } from "@/types";

// Import the attendance cache utilities
import { saveAttendanceToCache, loadAttendanceFromCache, clearAttendanceCache } from "@/utils/attendanceCache";

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
  const { setTodayAttendance } = useAttendanceStore();
  const { birthdayMessage, showBirthdayBanner, hideBirthdayBanner } = useBirthdayStore();
  const { branches, loading: branchesLoading, error: branchesError } = useBranches();
  const {
    latitude,
    longitude,
    accuracy,
    error: geoError,
    loading: geoLoading,
    getCurrentPosition,
  } = useGeolocation();
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
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
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [showGeofenceWarning, setShowGeofenceWarning] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState<{ 
    distance: number; 
    branchName: string; 
    allowedRadius: number; 
    isWithinGeofence: boolean 
  } | null>(null);
  // New state for better UX
  const [gettingLocation, setGettingLocation] = useState(false);

  // Clear cache when user changes
  useEffect(() => {
    if (user) {
      // Clear any existing cache for previous user
      clearAttendanceCache();
    }
  }, [user]);

  // Log branch errors for debugging
  useEffect(() => {
    if (branchesError) {
      console.error('Branch loading error:', branchesError);
    }
  }, [branchesError]);

  // Automatically calculate distance when location or branch selection changes
  // Use the continuous geolocation watcher data for UI updates
  useEffect(() => {
    if (latitude && longitude && selectedBranchId && branches.length > 0) {
      const selectedBranch = branches.find(b => b._id === selectedBranchId);
      if (selectedBranch) {
        const distance = calculateDistance(
          latitude,
          longitude,
          selectedBranch.location.lat,
          selectedBranch.location.lng
        );
      
        setDistanceInfo({
          distance: Math.round(distance),
          branchName: selectedBranch.name,
          allowedRadius: selectedBranch.radius ?? 50,
          isWithinGeofence: distance <= (selectedBranch.radius ?? 50)
        });
        
        // Store the coordinates for use in check-in/check-out
        setCoordinates({
          lat: latitude,
          lng: longitude
        });
      }
    }
  }, [latitude, longitude, selectedBranchId, branches]);
  // Clear general error when we have valid coordinates
  // This handles the case where geolocation watcher had an error but we successfully got coordinates
  useEffect(() => {
    if (coordinates && error === "Failed to get current location") {
      setError("");
    }
  }, [coordinates, error]);

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
  }, [user]); // Add user as dependency so it re-runs when user changes

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
  }, [user]); // Add user as dependency

  // Removed auto-fetch on component mount as per optimization requirements
  // Data will only be fetched when user explicitly clicks refresh button

  // Remove auto-fetch useEffect and replace with manual refresh
  // Optimized to only fetch essential data (today's attendance status)
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTodayStatus();
      // Clear rate limit error flag on success
      localStorage.removeItem("rateLimitError");
    } catch (err) {
      console.error("Failed to refresh data:", err);
      // Check if it's a rate limit error
      if (err && typeof err === 'object' && 'response' in err && 
          err.response && typeof err.response === 'object' && 'status' in err.response && 
          err.response.status === 429) {
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
      // Clear rate limit error flag on success
      localStorage.removeItem("rateLimitError");
    } catch (err: unknown) {
      console.error("Failed to fetch today status:", err);
      // Check if it's a rate limit error
      if (err && typeof err === 'object' && 'response' in err && 
          err.response && typeof err.response === 'object' && 'status' in err.response && 
          err.response.status === 429) {
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
    
    // Show immediate feedback to user
    setGettingLocation(true);
    
    try {
      // Use the coordinates from the continuous geolocation watcher
      // If they're not available, fall back to explicit location request
      let coords;
      if (coordinates) {
        coords = coordinates;
      } else {
        const position = await getCurrentPosition();
        coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoordinates(coords);
      }

      // Calculate distance to selected branch if available
      if (selectedBranchId && branches.length > 0) {
        const selectedBranch = branches.find(b => b._id === selectedBranchId);
        if (selectedBranch) {
          const distance = calculateDistance(
            coords.lat,
            coords.lng,
            selectedBranch.location.lat,
            selectedBranch.location.lng
          );
        
          setDistanceInfo({
            distance: Math.round(distance),
            branchName: selectedBranch.name,
            allowedRadius: selectedBranch.radius ?? 50,
            isWithinGeofence: distance <= (selectedBranch.radius ?? 50)
          });
        }
      }
      
      // Instead of doing local geofence validation, proceed directly to confirmation
      // The backend will handle all geofence validation with the new multi-branch system
      setPendingAction(action);
      setShowConfirmation(true);
    } catch {
      setError("Failed to get current location");
      toast.error("Location error", {
        description: "Unable to get your current location. Please try again.",
      });
    } finally {
      setGettingLocation(false);
    }
  };

  const executeAttendanceAction = async () => {    // Validate that we have coordinates
    if (!coordinates || !pendingAction) {
      setError("Location not available. Please enable location access.");
      return;
    }

    // Validate branch selection
    if (!selectedBranchId) {
      setError("Please select a branch before proceeding.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      // Use the same coordinates that were used for UI distance calculation
      const response =
        pendingAction === "checkin"
          ? await attendanceAPI.checkin(coordinates.lat, coordinates.lng, selectedBranchId)
          : await attendanceAPI.checkout(coordinates.lat, coordinates.lng, selectedBranchId);

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

  const isWithinAttendanceWindow = () => {
    const now = new Date();
    const time = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
    const minTime = 1; // 12:01 AM in minutes (0 * 60 + 1)
    const maxTime = 23 * 60 + 59; // 11:59 PM in minutes (23 * 60 + 59)
    return time >= minTime && time <= maxTime;
  };

  const isWithinFairOfficeHours = () => {
    const now = new Date();
    const hour = now.getHours();
    // Office hours: 9 AM to 8 PM
    return hour >= 9 && hour <= 20;
  };

  // New function to mark flagged attendance
  const markFlaggedAttendance = async (action: "checkin" | "checkout") => {
    // Validate that we have coordinates
    if (!coordinates) {
      setError("Location not available. Please enable location access.");
      toast.error("Location not available", {
        description: "Please enable location access.",
      });
      return;
    }

    // Validate branch selection
    if (!selectedBranchId) {
      setError("Please select a branch before proceeding.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      // Mark attendance as flagged regardless of location
      // Use the same coordinates that were used for UI distance calculation
      const response =
        action === "checkin"
          ? await attendanceAPI.checkin(coordinates.lat, coordinates.lng, selectedBranchId)
          : await attendanceAPI.checkout(coordinates.lat, coordinates.lng, selectedBranchId);

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
        setShowGeofenceWarning(false);
              
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
  };  // Improved logic for determining check-in/check-out eligibility
  // Ensure button states are strictly based on backend data
  const canCheckin = todayStatus?.attendance ? !todayStatus.attendance.checkInTime : true;
  const canCheckout = todayStatus?.attendance 
    ? todayStatus.attendance.checkInTime && !todayStatus.attendance.checkOutTime
    : false;
    
  // Ensure buttons are properly disabled when data is loading or unavailable
  const isDataLoading = (todayStatus === null && !error) || branchesLoading;
    
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
          {refreshing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Birthday Banner */}
      {showBirthdayBanner && birthdayMessage && (
        <Alert className="alert-modern bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2">🎉</span>
              <span>{birthdayMessage}</span>
              <span className="ml-2">🥳🎂</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={hideBirthdayBanner}
              className="text-white hover:bg-white/20"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="alert-modern">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && !showGeofenceWarning && (
        <Alert variant="destructive" className="alert-modern">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Branch Selection moved to main dashboard area */}
      {branches.length > 0 && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Select Branch
            </CardTitle>
            <CardDescription>
              Please select your branch before checking in or out
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dashboard-branch">Branch Location</Label>
                <Select 
                  value={selectedBranchId} 
                  onValueChange={(value) => {
                    setSelectedBranchId(value);
                    // Recalculate distance when branch changes
                    if (coordinates && branches.length > 0) {
                      const selectedBranch = branches.find(b => b._id === value);
                      if (selectedBranch) {
                        const distance = calculateDistance(
                          coordinates.lat,
                          coordinates.lng,
                          selectedBranch.location.lat,
                          selectedBranch.location.lng
                        );
                      
                        setDistanceInfo({
                          distance: Math.round(distance),
                          branchName: selectedBranch.name,
                          allowedRadius: selectedBranch.radius ?? 50,
                          isWithinGeofence: distance <= (selectedBranch.radius ?? 50)
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Distance Information in Main Dashboard */}
              {selectedBranchId && distanceInfo && (
                <div className={`p-3 rounded-lg border ${
                  distanceInfo.isWithinGeofence 
                    ? "bg-green-50 border-green-200" 
                    : "bg-amber-50 border-amber-200"
                }`}>
                  <div className="flex items-start">
                    <Navigation className={`w-4 h-4 mt-0.5 mr-2 flex-shrink-0 ${
                      distanceInfo.isWithinGeofence 
                        ? "text-green-500" 
                        : "text-amber-500"
                    }`} />
                    <div>
                      <p className={`font-medium ${
                        distanceInfo.isWithinGeofence 
                          ? "text-green-800" 
                          : "text-amber-800"
                      }`}>
                        Distance Information
                      </p>
                      {distanceInfo.isWithinGeofence ? (
                        <div className="mt-2 flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="font-medium">You are inside geofence of your selected branch 😁</span>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <div className="flex items-center text-amber-600">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            <span className="font-medium">
                              You are at {distanceInfo.distance} meters away from the branch you selected 😒
                            </span>
                          </div>
                          <p className="text-xs text-amber-700 mt-1">
                            If you are already inside the geofence, try to refresh to exact location 😊
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!selectedBranchId && (
                <p className="text-sm text-amber-600">
                  ⚠️ Please select a branch before checking in or out
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Today's Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {geoLoading || gettingLocation ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                {geoLoading ? "Getting your location..." : "Preparing attendance..."}
              </p>
            </div>
          ) : (geoError && !coordinates) ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MapPin className="w-8 h-8 text-destructive mx-auto" />
              <p className="mt-2 text-sm text-destructive">
                Location access denied
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please enable location access in your browser settings
              </p>
            </div>
          ) : (
            <>
              {!todayStatus ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading attendance status...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(todayStatus.attendance?.status || "absent")}
                  </div>

                  {todayStatus.attendance?.checkInTime && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Check-in Status:</span>
                      <Badge variant="default" className="bg-green-500 text-green-50">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  )}

                  {todayStatus.attendance?.checkOutTime && (
                    <div className="flex items-center justify-between">
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
            </>
          )}

          <Separator />

          <div className="flex space-x-3">
            <Button
              onClick={() => prepareAttendanceAction("checkin")}
              disabled={
                !canCheckin ||
                actionLoading ||
                (!!geoError && !coordinates) ||
                !isWithinAttendanceWindow() || // Changed from isWithinOfficeHours()
                isDataLoading ||
                !selectedBranchId ||
                gettingLocation
              }
              className={getCheckInButtonClass()}
            >
              {(actionLoading && pendingAction === "checkin") || gettingLocation || isDataLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {gettingLocation ? "Getting Location..." : isDataLoading ? "Loading..." : "Check In"}
            </Button>

            <Button
              onClick={() => prepareAttendanceAction("checkout")}
              disabled={
                !canCheckout || 
                actionLoading || 
                (!!geoError && !coordinates) || 
                !isWithinAttendanceWindow() || // Changed from isWithinOfficeHours()
                isDataLoading || 
                !selectedBranchId ||
                gettingLocation
              }
              className={getCheckOutButtonClass()}
            >
              {(actionLoading && pendingAction === "checkout") || gettingLocation || isDataLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {gettingLocation ? "Getting Location..." : isDataLoading ? "Loading..." : "Check Out"}
            </Button>
          </div>
          {!isWithinFairOfficeHours() && isWithinAttendanceWindow() && (
            <p className="text-sm text-amber-500 text-center">
              ⚠️ Outside fair office hours (9:00 AM - 8:00 PM)
            </p>
          )}
          {!isWithinAttendanceWindow() && (
            <p className="text-sm text-red-500 text-center">
              ⚠️ Outside attendance window (12:01 AM - 11:59 PM)
            </p>
          )}

        </CardContent>
      </Card>

      {/* Simplified Attendance Confirmation Dialog - Branch selection removed */}
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

            {selectedBranchId && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Selected Branch</span>
                </div>
                <div className="text-sm pl-6">
                  <p>{branches.find(b => b._id === selectedBranchId)?.name}</p>
                </div>
              </div>
            )}

            {/* Distance Information in Confirmation Dialog */}
            {distanceInfo && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <Navigation className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800">Distance Information</p>
                    {distanceInfo.isWithinGeofence ? (
                      <div className="mt-2 flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="font-medium">You are inside geofence of your selected branch 😁</span>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="flex items-center text-amber-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          <span className="font-medium">
                            You are at {distanceInfo.distance} meters away from the branch you selected 😒
                          </span>
                        </div>
                        <p className="text-xs text-amber-700 mt-1">
                          If you are already inside the geofence, try to refresh to exact location 😊
                        </p>
                      </div>
                    )}
                  </div>
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

      {/* Simplified Geofence Warning Dialog - Branch selection removed */}
      <Dialog open={showGeofenceWarning} onOpenChange={(open) => {
        setShowGeofenceWarning(open);
      }}>
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
                    for manager review. Are you sure you want to proceed? 😒
                  </p>
                  {selectedBranchId && (
                    <p className="text-sm text-orange-500">
                      Selected Branch: {branches.find(b => b._id === selectedBranchId)?.name}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {distanceInfo && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start">
                <Navigation className="w-4 h-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Distance Information</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You are <span className="font-bold">{distanceInfo.distance} meters</span> away from {distanceInfo.branchName}
                  </p>
                
                  <div className="mt-2 flex items-center text-amber-600">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    <span className="font-medium">
                      You are at {distanceInfo.distance} meters away from the branch you selected 😒
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    If you are already inside the geofence, try to refresh to exact location 😊
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowGeofenceWarning(false);
              }}
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
                "Mark Flagged Attendance 😒"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}