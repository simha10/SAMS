import { useState, useEffect } from "react";
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
  subDays,
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
import { AlertTriangle, CheckCircle, XCircle, MapPin } from "lucide-react";

export default function Attendance() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [currentMonth]);

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    setError("");

    try {
      const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const response = await attendanceAPI.getMyAttendance(startDate, endDate);

      if (response.success && response.data) {
        setAttendanceRecords(response.data.attendance);
      }
    } catch (err) {
      setError("Failed to fetch attendance records");
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, flagged: boolean) => {
    if (flagged) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Flagged
        </Badge>
      );
    }

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
            <MapPin className="w-3 h-3 mr-1" />
            On Leave
          </Badge>
        );
      case "outside-geo":
        return (
          <Badge variant="destructive">
            <MapPin className="w-3 h-3 mr-1" />
            Outside Area
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAttendanceForDate = (date: Date) => {
    return attendanceRecords.find((record) =>
      isSameDay(new Date(record.date), date)
    );
  };

  const getDayClassNames = (day: Date) => {
    const attendance = getAttendanceForDate(day);
    let baseClasses =
      "flex items-center justify-center h-10 w-10 rounded-full text-sm cursor-pointer ";

    if (!isSameMonth(day, currentMonth)) {
      return baseClasses + "text-gray-400";
    }

    if (isSameDay(day, new Date())) {
      baseClasses += "bg-blue-100 font-bold ";
    }

    if (isSameDay(day, selectedDate || hoveredDate || new Date(0))) {
      baseClasses += "bg-blue-500 text-white ";
    }

    if (attendance) {
      if (attendance.flagged) {
        baseClasses += "bg-red-100 ";
      } else if (attendance.status === "present") {
        baseClasses += "bg-green-100 ";
      } else if (attendance.status === "absent") {
        baseClasses += "bg-red-100 ";
      } else if (attendance.status === "on-leave") {
        baseClasses += "bg-blue-100 ";
      } else if (attendance.status === "outside-geo") {
        baseClasses += "bg-yellow-100 ";
      }
    } else {
      // Default to absent for days without records
      baseClasses += "bg-red-50 ";
    }

    return baseClasses;
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startDayOfWeek = monthStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const paddingDays = Array(startDayOfWeek).fill(null);

    return (
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-gray-600">
          View your attendance records in calendar format
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
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
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <div className="space-y-6">
              <div className="border rounded-lg">{renderCalendar()}</div>

              {selectedAttendance && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Attendance Details -{" "}
                      {format(
                        new Date(selectedAttendance.date),
                        "EEEE, MMMM d, yyyy"
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          {selectedAttendance.checkInTime && (
                            <span>
                              In:{" "}
                              {format(
                                new Date(selectedAttendance.checkInTime),
                                "HH:mm:ss"
                              )}
                            </span>
                          )}
                          {selectedAttendance.checkOutTime && (
                            <span>
                              Out:{" "}
                              {format(
                                new Date(selectedAttendance.checkOutTime),
                                "HH:mm:ss"
                              )}
                            </span>
                          )}
                          {selectedAttendance.workingHours > 0 && (
                            <span>
                              Hours:{" "}
                              {Math.floor(selectedAttendance.workingHours / 60)}
                              h {selectedAttendance.workingHours % 60}m
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(
                          selectedAttendance.status,
                          selectedAttendance.flagged
                        )}
                      </div>
                    </div>

                    {selectedAttendance.flagged &&
                      isFlaggedAttendanceRecord(selectedAttendance) &&
                      selectedAttendance.flaggedReason && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                          <AlertTriangle className="w-4 h-4 inline mr-1" />
                          {selectedAttendance.flaggedReason}
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}

              {!selectedAttendance && (
                <div className="text-center py-8 text-gray-500">
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
