import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { attendanceAPI, leaveAPI } from "@/services/api";
import type { AttendanceRecord, LeaveRequest } from "@/types";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function History() {
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"attendance" | "leave">(
    "attendance"
  );

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch attendance records
      const attendanceResponse = await attendanceAPI.getMyAttendance(
        format(dateFrom, "yyyy-MM-dd"),
        format(dateTo, "yyyy-MM-dd")
      );

      // Fetch leave requests
      const leaveResponse = await leaveAPI.getMyLeaveRequests();

      if (attendanceResponse.success && attendanceResponse.data) {
        setAttendanceRecords(attendanceResponse.data.attendance);
      }

      if (leaveResponse.success && leaveResponse.data) {
        setLeaveRequests(leaveResponse.data.leaveRequests);
      }
    } catch (err) {
      setError("Failed to fetch history data");
      console.error("Error fetching history:", err);
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

  const getLeaveStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            Approved
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case "sick":
        return <Badge variant="destructive">Sick</Badge>;
      case "personal":
        return <Badge variant="secondary">Personal</Badge>;
      case "vacation":
        return (
          <Badge variant="default" className="bg-blue-500">
            Vacation
          </Badge>
        );
      case "emergency":
        return (
          <Badge variant="default" className="bg-red-500">
            Emergency
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // Calculate statistics
  const presentDays = attendanceRecords.filter(
    (record) => record.status === "present"
  ).length;
  const absentDays = attendanceRecords.filter(
    (record) => record.status === "absent"
  ).length;
  const flaggedDays = attendanceRecords.filter(
    (record) => record.flagged
  ).length;
  const leaveDays = leaveRequests
    .filter((request) => request.status === "approved")
    .reduce((total, request) => total + request.days, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-gray-600">View your attendance and leave history</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{presentDays}</div>
            <div className="text-sm text-gray-600">Present Days</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{absentDays}</div>
            <div className="text-sm text-gray-600">Absent Days</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{flaggedDays}</div>
            <div className="text-sm text-gray-600">Flagged Days</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{leaveDays}</div>
            <div className="text-sm text-gray-600">Leave Days</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Records</CardTitle>
          <CardDescription>
            Select a date range to view history records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <div className="relative">
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                  onClick={() => document.getElementById("date-from")?.focus()}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                </Button>
                <Input
                  id="date-from"
                  type="date"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={dateFrom ? format(dateFrom, "yyyy-MM-dd") : ""}
                  onChange={(e) => setDateFrom(new Date(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <div className="relative">
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                  onClick={() => document.getElementById("date-to")?.focus()}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                </Button>
                <Input
                  id="date-to"
                  type="date"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={dateTo ? format(dateTo, "yyyy-MM-dd") : ""}
                  onChange={(e) => setDateTo(new Date(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchHistoryData} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Filter Records
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-6">
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "attendance"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("attendance")}
          >
            Attendance
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "leave"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("leave")}
          >
            Leave Requests
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "attendance" ? (
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>
              Attendance records from {format(dateFrom, "MMM d, yyyy")} to{" "}
              {format(dateTo, "MMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No attendance records found for the selected date range
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceRecords.map((record) => (
                  <div key={record._id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-medium">
                          {format(new Date(record.date), "EEEE, MMMM d, yyyy")}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          {record.checkInTime && (
                            <span>
                              In:{" "}
                              {format(new Date(record.checkInTime), "HH:mm:ss")}
                            </span>
                          )}
                          {record.checkOutTime && (
                            <span>
                              Out:{" "}
                              {format(
                                new Date(record.checkOutTime),
                                "HH:mm:ss"
                              )}
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
                      <div className="flex items-center gap-2">
                        {getStatusBadge(record.status, record.flagged)}
                      </div>
                    </div>

                    {record.flagged && record.flaggedReason && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        {record.flaggedReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>Your leave request history</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No leave requests found
              </div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div key={request._id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-medium">
                          {format(new Date(request.startDate), "MMM d, yyyy")} -{" "}
                          {format(new Date(request.endDate), "MMM d, yyyy")}
                          <span className="ml-2">
                            {getLeaveTypeBadge(request.type)}
                          </span>
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {request.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getLeaveStatusBadge(request.status)}
                      </div>
                    </div>

                    {request.status === "rejected" &&
                      request.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          Rejection reason: {request.rejectionReason}
                        </div>
                      )}

                    <div className="mt-2 text-sm text-gray-500">
                      Requested on{" "}
                      {format(new Date(request.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
