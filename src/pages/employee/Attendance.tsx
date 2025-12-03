import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { attendanceAPI } from "@/services/api";
import type { AttendanceRecord, FlaggedAttendanceRecord } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
} from "lucide-react";

export default function Attendance() {
  console.log("=== ATTENDANCE COMPONENT INIT ===");
  console.log("Timestamp:", new Date().toISOString());

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Remove auto-fetch useEffect and replace with manual refresh
  const handleRefresh = async () => {
    console.log("=== FETCH ATTENDANCE RECORDS STARTED ===");
    console.log("Current month:", currentMonth);
    setRefreshing(true);
    setError("");

    try {
      const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      console.log("Fetching attendance records from", startDate, "to", endDate);

      const response = await attendanceAPI.getMyAttendance(startDate, endDate);
      console.log("Attendance API response:", response);

      if (response.success && response.data) {
        setAttendanceRecords(response.data.attendance);
        console.log(
          "Set attendance records count:",
          response.data.attendance.length
        );
      }
    } catch (err) {
      console.error("=== FETCH ATTENDANCE RECORDS ERROR ===");
      console.error("Error:", err);
      setError("Failed to fetch attendance records");
      console.error("Error fetching attendance:", err);
      console.log("=== END FETCH ATTENDANCE RECORDS ERROR ===");
    } finally {
      setRefreshing(false);
      console.log("=== FETCH ATTENDANCE RECORDS COMPLETED ===");
    }
  };

  const fetchAttendanceRecords = async () => {
    console.log("=== FETCH ATTENDANCE RECORDS STARTED ===");
    console.log("Current month:", currentMonth);
    setLoading(true);
    setError("");

    try {
      const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      console.log("Fetching attendance records from", startDate, "to", endDate);

      const response = await attendanceAPI.getMyAttendance(startDate, endDate);
      console.log("Attendance API response:", response);

      if (response.success && response.data) {
        setAttendanceRecords(response.data.attendance);
        console.log(
          "Set attendance records count:",
          response.data.attendance.length
        );
      }
    } catch (err) {
      console.error("=== FETCH ATTENDANCE RECORDS ERROR ===");
      console.error("Error:", err);
      setError("Failed to fetch attendance records");
      console.error("Error fetching attendance:", err);
      console.log("=== END FETCH ATTENDANCE RECORDS ERROR ===");
    } finally {
      setLoading(false);
      console.log("=== FETCH ATTENDANCE RECORDS COMPLETED ===");
    }
  };

  const getStatusBadge = (
    status: string,
    flagged: boolean,
    isHalfDay?: boolean
  ) => {
    console.log("Getting status badge for:", { status, flagged, isHalfDay });

    // Show flagged status with yellow color
    if (flagged) {
      return (
        <Badge variant="default" className="bg-amber-500 text-amber-50">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Flagged
        </Badge>
      );
    }

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
            <MapPin className="w-3 h-3 mr-1" />
            On Leave
          </Badge>
        );
      case "outside-duty":
        return (
          <Badge variant="default" className="bg-amber-500 text-amber-50">
            <MapPin className="w-3 h-3 mr-1" />
            Outside Duty
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAttendanceForDate = (date: Date) => {
    console.log("Getting attendance for date:", date);
    const result = attendanceRecords.find((record) =>
      isSameDay(new Date(record.date), date)
    );
    console.log("Found attendance record:", result);
    return result;
  };

  const getDayClassNames = (day: Date) => {
    const attendance = getAttendanceForDate(day);
    let baseClasses =
      "flex items-center justify-center h-10 w-10 rounded-full text-sm font-medium transition-all duration-200 ";

    if (!isSameMonth(day, currentMonth)) {
      baseClasses += "text-gray-400 ";
    } else {
      baseClasses += "text-gray-700 hover:bg-gray-100 ";
    }

    // Today's date styling
    if (isSameDay(day, new Date())) {
      baseClasses += "bg-blue-500 text-white font-bold shadow-sm ";
    }

    // Selected date styling
    const currentDate = selectedDate || hoveredDate;
    if (currentDate && isSameDay(day, currentDate)) {
      baseClasses += "ring-2 ring-blue-400 ring-offset-1 ";
    }

    if (attendance) {
      if (attendance.flagged) {
        baseClasses += "bg-amber-100 text-amber-800 border-2 border-amber-300 "; // Amber for flagged
      } else if (attendance.status === "present") {
        baseClasses +=
          "bg-emerald-100 text-emerald-800 border-2 border-emerald-300 "; // Emerald for present
      } else if (attendance.status === "absent") {
        baseClasses += "bg-rose-100 text-rose-800 border-2 border-rose-300 "; // Rose for absent
      } else if (attendance.status === "half-day") {
        baseClasses +=
          "bg-orange-100 text-orange-800 border-2 border-orange-300 "; // Orange for half-day
      } else if (attendance.status === "on-leave") {
        baseClasses += "bg-sky-100 text-sky-800 border-2 border-sky-300 "; // Sky blue for on-leave
      } else if (attendance.status === "outside-duty") {
        baseClasses +=
          "bg-violet-100 text-violet-800 border-2 border-violet-300 "; // Violet for outside-duty
      }
    } else {
      // Default for days without records
      if (isSameMonth(day, currentMonth)) {
        baseClasses += "bg-gray-50 text-gray-500 border border-gray-200 ";
      }
    }

    return baseClasses;
  };

  const renderCalendar = () => {
    console.log("Rendering calendar for:", currentMonth);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startDayOfWeek = monthStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const paddingDays = Array(startDayOfWeek).fill(null);

    return (
      <div className="p-4 border rounded-lg ">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} className="h-10"></div>
          ))}
          {daysInMonth.map((day, index) => (
            <div
              key={index}
              className={getDayClassNames(day)}
              onClick={() => setSelectedDate(day)}
              onMouseEnter={() => setHoveredDate(day)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              {format(day, "d")}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getSelectedDateAttendance = () => {
    if (!selectedDate && !hoveredDate) return null;
    const date = selectedDate || hoveredDate;
    return date ? getAttendanceForDate(date) : null;
  };

  const selectedAttendance = getSelectedDateAttendance();

  // Type guard to check if attendance record has flaggedReason
  const isFlaggedAttendanceRecord = (
    record: AttendanceRecord
  ): record is FlaggedAttendanceRecord => {
    return record.flagged && "flaggedReason" in record;
  };

  console.log("=== ATTENDANCE COMPONENT RENDER ===");
  console.log("State:", {
    currentMonth,
    attendanceRecordsCount: attendanceRecords.length,
    loading,
    error,
    selectedDate,
    hoveredDate,
  });

  return (
    <div className="space-y-6 p-4 border-2 border-white rounded-lg">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">
          View your attendance records in calendar format
        </p>
      </div>

      <Card className="card-modern">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <CardDescription>
                Click on a date to view attendance details
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="btn-secondary"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                className="btn-secondary"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="btn-secondary"
              >
                Next
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh} 
                disabled={loading || refreshing}
                className="flex items-center btn-secondary"
              >
                <Loader2 className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading || refreshing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading attendance records...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : (
            <div className="space-y-6">
              <div className="border rounded-lg border-border">
                {renderCalendar()}
              </div>

              {selectedAttendance && (
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle>
                      Attendance Details -{" "}
                      {selectedAttendance &&
                        format(
                          new Date(selectedAttendance.date),
                          "EEEE, MMMM d, yyyy"
                        )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          {selectedAttendance &&
                            selectedAttendance.checkInTime && (
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                In:{" "}
                                {format(
                                  new Date(selectedAttendance.checkInTime),
                                  "HH:mm:ss"
                                )}
                              </span>
                            )}
                          {selectedAttendance &&
                            selectedAttendance.checkOutTime && (
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                Out:{" "}
                                {format(
                                  new Date(selectedAttendance.checkOutTime),
                                  "HH:mm:ss"
                                )}
                              </span>
                            )}
                          {selectedAttendance &&
                            selectedAttendance.workingHours > 0 && (
                              <span>
                                Hours:{" "}
                                {Math.floor(
                                  selectedAttendance.workingHours / 60
                                )}
                                h {selectedAttendance.workingHours % 60}m
                              </span>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedAttendance &&
                          getStatusBadge(
                            selectedAttendance.status,
                            selectedAttendance.flagged,
                            selectedAttendance.isHalfDay
                          )}
                      </div>
                    </div>

                    {selectedAttendance &&
                      selectedAttendance.flagged &&
                      isFlaggedAttendanceRecord(selectedAttendance) &&
                      selectedAttendance.flaggedReason && (
                        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-800/50 rounded-lg text-sm text-yellow-200">
                          <AlertTriangle className="w-4 h-4 inline mr-2" />
                          <span className="font-medium">
                            Flagged Reason:
                          </span>{" "}
                          {selectedAttendance.flaggedReason}
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}

              {!selectedAttendance && (
                <div className="text-center py-8 text-muted-foreground">
                  Select a date to view attendance details
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
