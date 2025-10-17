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
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { attendanceAPI, leaveAPI, notificationsAPI } from "@/services/api";
import { format } from "date-fns";
import type { AttendanceRecord, LeaveRequest, ApiError } from "@/types";
import { haversine } from "@/config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [pendingAction, setPendingAction] = useState<
    "checkin" | "checkout" | null
  >(null);
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<{
    distance: number;
    allowedRadius: number;
  } | null>(null);
  const [showGeofenceWarning, setShowGeofenceWarning] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (mounted) {
        await fetchTodayStatus();
      }
      if (mounted) {
        await fetchRecentAttendance();
      }
      if (mounted) {
        // Add a delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 300));
        await fetchRecentLeaves();
      }
      if (mounted) {
        // Add a delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 300));
        await fetchRecentNotifications();
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const response = await attendanceAPI.getTodayStatus();
      if (response.success && response.data) {
        setTodayStatus(response.data);
      }
      setRateLimitError(false);
    } catch (err: unknown) {
      console.error("Failed to fetch today status:", err);
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
    } catch (err: unknown) {
      console.error("Failed to fetch attendance history:", err);
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
    } catch (err: unknown) {
      console.error("Failed to fetch leave requests:", err);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications(10, 0); // Get last 10 notifications
      if (response.success && response.data) {
        setRecentNotifications(response.data.notifications.slice(0, 5)); // Get last 5 notifications
      }
      setRateLimitError(false);
    } catch (err: unknown) {
      console.error("Failed to fetch notifications:", err);
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

      // Calculate distance from office using environment variables
      const officeLat =
        parseFloat(import.meta.env.VITE_OFFICE_LAT) || 26.91359535056058;
      const officeLng =
        parseFloat(import.meta.env.VITE_OFFICE_LNG) || 80.95348145976982;
      const allowedRadius = parseInt(import.meta.env.VITE_OFFICE_RADIUS) || 100;

      const distance = haversine(coords.lat, coords.lng, officeLat, officeLng);

      if (distance > allowedRadius) {
        // User is outside geofence - show error dialog
        setDistanceInfo({
          distance: Math.round(distance),
          allowedRadius: allowedRadius,
        });
        setShowGeofenceWarning(true);
        setError(
          `You are ${Math.round(
            distance
          )}m away from the office location. You must be within ${allowedRadius}m to mark attendance.`
        );
        return;
      }

      // User is within geofence - proceed with confirmation
      setPendingAction(action);
      setShowConfirmation(true);
    } catch (err) {
      setError("Failed to get current location");
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
        // Refresh today's status after successful action
        await fetchTodayStatus();
        setShowConfirmation(false);
        setPendingAction(null);
        setDistanceInfo(null);
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
          setDistanceInfo({
            distance: geofenceData.distance,
            allowedRadius: geofenceData.allowedRadius,
          });
          setShowGeofenceWarning(true);
        }
        setError(response.message || `${pendingAction} failed`);
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
        setDistanceInfo({
          distance: geofenceData.distance,
          allowedRadius: geofenceData.allowedRadius,
        });
        setShowGeofenceWarning(true);
        setError(error.response.data.message || `${pendingAction} failed`);
      } else {
        setError(error.response?.data?.message || `${pendingAction} failed`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Absent
          </Badge>
        );
      case "on-leave":
        return (
          <Badge variant="secondary" className="bg-blue-500 text-white">
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

  // Fixed logic for determining check-in/check-out eligibility
  const canCheckin = !todayStatus?.attendance?.checkInTime;
  const canCheckout =
    todayStatus?.attendance?.checkInTime &&
    !todayStatus?.attendance?.checkOutTime;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {/* Rate Limit Error Message */}
      {rateLimitError && (
        <Alert variant="destructive">
          <AlertDescription>
            Server is receiving too many requests. Please wait a moment and try
            again.
          </AlertDescription>
        </Alert>
      )}

      {/* Location Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Location Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {geoLoading ? (
            <div className="flex items-center text-gray-600">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting your location...
            </div>
          ) : geoError ? (
            <Alert variant="destructive">
              <AlertDescription>{geoError}</AlertDescription>
            </Alert>
          ) : (
            <div className="text-sm text-gray-600">
              <p>Latitude: {latitude?.toFixed(6)}</p>
              <p>Longitude: {longitude?.toFixed(6)}</p>
              <p className="mt-2 text-green-600">✓ Location access granted</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Status */}
      <Card>
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
            <Alert>
              <AlertDescription className="text-green-600">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {error && !distanceInfo && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {todayStatus && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                {getStatusBadge(todayStatus.attendance.status)}
              </div>

              {todayStatus.attendance.checkInTime && (
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

              {todayStatus.attendance.checkOutTime && (
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

              {todayStatus.attendance.workingHours > 0 && (
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
              className="flex-1"
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
              className="flex-1"
            >
              {actionLoading && pendingAction === "checkout" && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Check Out
            </Button>
          </div>

          {!isWithinOfficeHours() && (
            <p className="text-sm text-amber-600 text-center">
              ⚠️ Outside office hours (9:00 AM - 8:00 PM)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : recentAttendance.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No attendance records found
            </p>
          ) : (
            <div className="space-y-3">
              {recentAttendance.map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {format(new Date(record.date), "MMM d, yyyy")}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                      {record.workingHours > 0 && (
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Recent Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLeaves.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No leave requests found
            </p>
          ) : (
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div
                  key={leave._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {leave.type} - {leave.status}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>
                        From: {format(new Date(leave.startDate), "MMM d, yyyy")}
                      </span>
                      <span>
                        To: {format(new Date(leave.endDate), "MMM d, yyyy")}
                      </span>
                      <span>{leave.days} days</span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      leave.status === "approved"
                        ? "default"
                        : leave.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {leave.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentNotifications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No notifications found
            </p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className="flex items-start p-3 border rounded-lg"
                >
                  <Bell className="w-4 h-4 mr-3 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(
                        new Date(notification.createdAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[425px]">
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

          {error && !distanceInfo && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {distanceInfo && (
            <Alert variant="destructive">
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-orange-800">
                    ⚠️ You are {distanceInfo.distance}m away from the office
                    location!
                  </p>

                  <p className="text-sm">
                    Allowed radius:{" "}
                    <span className="font-bold">
                      {distanceInfo.allowedRadius}m
                    </span>
                  </p>
                  <p className="text-sm text-orange-700">
                    If you believe this is incorrect, please check your location
                    services and try again.
                  </p>
                </div>
              </AlertDescription>
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
                  <p>Latitude: {coordinates.lat.toFixed(6)}</p>
                  <p>Longitude: {coordinates.lng.toFixed(6)}</p>
                </div>
              </div>
            )}

            <div className="rounded-md bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
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
                setDistanceInfo(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={executeAttendanceAction} disabled={actionLoading}>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Geofence Restriction</DialogTitle>
            <DialogDescription>
              You are outside the allowed office area.
            </DialogDescription>
          </DialogHeader>

          {distanceInfo && (
            <Alert variant="destructive">
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-orange-800">
                    ⚠️ You are {distanceInfo.distance}m away from the office
                    location!
                  </p>
                  <p className="text-sm">
                    Coordinates: {coordinates?.lat.toFixed(6)},{" "}
                    {coordinates?.lng.toFixed(6)}
                  </p>
                  <p className="text-sm">
                    Allowed radius:{" "}
                    <span className="font-bold">
                      {distanceInfo.allowedRadius}m
                    </span>
                  </p>
                  <p className="text-sm text-orange-700">
                    Please reach the office location and try again.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowGeofenceWarning(false)}
              disabled={actionLoading}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
