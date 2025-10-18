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
      case "outside-geo":
        return (
          <Badge variant="default" className="bg-rose-500 text-rose-50">
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
      case "pending":
        return (
          <Badge variant="default" className="bg-amber-500 text-amber-50">
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case "sick":
        return (
          <Badge variant="default" className="bg-rose-500 text-rose-50">
            Sick
          </Badge>
        );
      case "personal":
        return (
          <Badge variant="default" className="bg-sky-500 text-sky-50">
            Personal
          </Badge>
        );
      case "vacation":
        return (
          <Badge variant="default" className="bg-indigo-500 text-indigo-50">
            Vacation
          </Badge>
        );
      case "emergency":
        return (
          <Badge variant="default" className="bg-red-500 text-red-50">
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
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-muted-foreground">
          View your attendance and leave history
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{presentDays}</div>
            <div className="text-sm text-muted-foreground">Present Days</div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{absentDays}</div>
            <div className="text-sm text-muted-foreground">Absent Days</div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{flaggedDays}</div>
            <div className="text-sm text-muted-foreground">Flagged Days</div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{leaveDays}</div>
            <div className="text-sm text-muted-foreground">Leave Days</div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-modern">
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
                    "w-full justify-start text-left font-normal btn-secondary",
                    !dateFrom && "text-muted-foreground"
                  )}
                  onClick={() => document.getElementById("date-from")?.focus()}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-blue-200" />
                  {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                </Button>
                <Input
                  id="date-from"
                  type="date"
                  className="absolute inset-0 opacity-0 cursor-pointer input-modern"
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
                    "w-full justify-start text-left font-normal btn-secondary",
                    !dateTo && "text-muted-foreground"
                  )}
                  onClick={() => document.getElementById("date-to")?.focus()}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-blue-200" />
                  {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                </Button>
                <Input
                  id="date-to"
                  type="date"
                  className="absolute inset-0 opacity-0 cursor-pointer input-modern"
                  value={dateTo ? format(dateTo, "yyyy-MM-dd") : ""}
                  onChange={(e) => setDateTo(new Date(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                onClick={fetchHistoryData}
                disabled={loading}
                className="btn-primary"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Filter Records
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-6">
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "attendance"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("attendance")}
          >
            Attendance
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "leave"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("leave")}
          >
            Leave Requests
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "attendance" ? (
        <Card className="card-modern">
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
                <span className="ml-2">Loading attendance records...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">{error}</div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found for the selected date range
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceRecords.map((record) => (
                  <div
                    key={record._id}
                    className="border rounded-lg p-4 bg-secondary/50 border-border"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-medium">
                          {format(new Date(record.date), "EEEE, MMMM d, yyyy")}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
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
                      <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-800/50 rounded text-sm text-yellow-200">
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
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>Your leave request history</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading leave requests...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">{error}</div>
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leave requests found
              </div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div
                    key={request._id}
                    className="border rounded-lg p-4 bg-secondary/50 border-border"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-medium">
                          {format(new Date(request.startDate), "MMM d, yyyy")} -{" "}
                          {format(new Date(request.endDate), "MMM d, yyyy")}
                          <span className="ml-2">
                            {getLeaveTypeBadge(request.type)}
                          </span>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getLeaveStatusBadge(request.status)}
                      </div>
                    </div>

                    {request.status === "rejected" &&
                      request.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-900/30 border border-red-800/50 rounded text-sm text-red-200">
                          Rejection reason: {request.rejectionReason}
                        </div>
                      )}

                    <div className="mt-2 text-sm text-muted-foreground">
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
