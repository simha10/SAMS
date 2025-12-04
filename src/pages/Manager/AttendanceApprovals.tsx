import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { managerAPI } from "@/services/api";
import { format } from "date-fns";
import type { AttendanceRecord } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";

export default function AttendanceApprovals() {
  const [flaggedRecords, setFlaggedRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [approvalReason, setApprovalReason] = useState("");
  const [newStatus, setNewStatus] = useState("present");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [dateRange, setDateRange] = useState({
    from: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
  });

  // Removed auto-fetch on component mount as per optimization requirements
  // Data will only be fetched when user explicitly clicks the Refresh button or applies filters

  const fetchFlaggedAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await managerAPI.getFlaggedAttendance(
        dateRange.from,
        dateRange.to
      );
      if (response.success && response.data) {
        setFlaggedRecords(response.data.flaggedRecords);
      } else {
        setFlaggedRecords([]);
      }
    } catch (err: unknown) {
      setError("Failed to fetch flagged attendance records.");
      toast.error("Failed to fetch flagged attendance records", {
        description: "Could not load attendance records. Please try again.",
      });
      setFlaggedRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const response = await managerAPI.getFlaggedAttendance(
        dateRange.from,
        dateRange.to
      );
      if (response.success && response.data) {
        setFlaggedRecords(response.data.flaggedRecords);
      } else {
        setFlaggedRecords([]);
      }
    } catch (err: unknown) {
      setError("Failed to refresh flagged attendance records.");
      toast.error("Failed to refresh flagged attendance records", {
        description: "Could not load attendance records. Please try again.",
      });
      setFlaggedRecords([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAttendanceAction = async (
    id: string,
    status: string,
    approvalReason?: string,
    checkOutTime?: string
  ) => {
    try {
      const response = await managerAPI.updateAttendanceStatus(
        id,
        status,
        approvalReason,
        checkOutTime
      );
      if (response.success) {
        setMessage(`Attendance record updated to ${status} successfully`);
        toast.success(`Attendance record updated`, {
          description: `Attendance record has been updated to ${status} successfully.`,
        });
        fetchFlaggedAttendance();
        // Clear message after 3 seconds
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err: unknown) {
      setError("Failed to update attendance record");
      toast.error("Failed to update attendance record", {
        description: "Please try again.",
      });
    }
  };

  const openApprovalDialog = (id: string) => {
    setSelectedRecordId(id);
    setShowApprovalDialog(true);
  };

  const handleApprove = async () => {
    if (selectedRecordId) {
      await handleAttendanceAction(
        selectedRecordId,
        newStatus,
        approvalReason,
        checkOutTime
      );
      setShowApprovalDialog(false);
      setApprovalReason("");
      setCheckOutTime("");
      setSelectedRecordId(null);
      toast.success("Attendance record updated", {
        description: "Attendance record has been updated successfully.",
      });
    }
  };

  const getStatusBadge = (status: string, flagged: boolean) => {
    if (flagged) {
      return (
        <Badge variant="destructive" className="bg-yellow-500">
          Flagged
        </Badge>
      );
    }

    switch (status) {
      case "present":
        return (
          <Badge variant="default" className="bg-green-500">
            Present
          </Badge>
        );
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "half-day":
        return (
          <Badge variant="default" className="bg-yellow-700">
            Half Day
          </Badge>
        );
      case "on-leave":
        return (
          <Badge variant="secondary" className="bg-blue-500 text-white">
            On Leave
          </Badge>
        );
      case "outside-duty":
        return (
          <Badge variant="default" className="bg-orange-400">
            Outside Duty
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status || "N/A"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance Approvals</h1>
        <p className="text-gray-600">
          Review and approve/reject flagged attendance records from your staff
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert>
          <AlertDescription className="text-green-600">
            {message}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange({ ...dateRange, from: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange({ ...dateRange, to: e.target.value })
                }
              />
            </div>
            <div className="flex items-end space-x-2">
              <Button onClick={fetchFlaggedAttendance}>Apply Filters</Button>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="flex items-center btn-secondary bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flagged Attendance Records</CardTitle>
          <CardDescription>
            Attendance records awaiting your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading attendance records...</span>
            </div>
          ) : flaggedRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No flagged attendance records.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {flaggedRecords.map((record) => (
                <div key={record._id} className="p-4 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {(typeof record.userId === "object" &&
                          record.userId?.name) ||
                          "N/A"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {(typeof record.userId === "object" &&
                          record.userId?.empId) ||
                          "N/A"}{" "}
                        •{" "}
                        {record.date
                          ? format(new Date(record.date), "MMM d, yyyy")
                          : "N/A"}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <strong>Status:</strong>{" "}
                          {getStatusBadge(record.status, record.flagged)}
                        </p>
                        {record.checkInTime && (
                          <p className="text-sm">
                            <strong>Check-in:</strong>{" "}
                            {format(new Date(record.checkInTime), "HH:mm")}
                          </p>
                        )}
                        {record.checkOutTime && (
                          <p className="text-sm">
                            <strong>Check-out:</strong>{" "}
                            {format(new Date(record.checkOutTime), "HH:mm")}
                          </p>
                        )}
                        {record.workingHours !== undefined &&
                          record.workingHours > 0 && (
                            <p className="text-sm">
                              <strong>Working Hours:</strong>{" "}
                              {Math.floor(record.workingHours / 60)}h{" "}
                              {record.workingHours % 60}m
                            </p>
                          )}
                        {record.flaggedReason && (
                          <p className="text-sm text-yellow-600">
                            <strong>Flagged Reason:</strong>{" "}
                            {record.flaggedReason}
                          </p>
                        )}
                        {record.checkOutTime &&
                          record.flaggedReason &&
                          record.flaggedReason.includes("Auto checkout") && (
                            <p className="text-sm text-blue-600">
                              <strong>Auto Checkout:</strong> This record was
                              auto-checked out at 9:00 PM. You can update the
                              checkout time in the approval dialog.
                            </p>
                          )}
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end space-y-2">
                      {record.flagged && (
                        <Button
                          size="sm"
                          onClick={() => openApprovalDialog(record._id)}
                        >
                          Review & Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Attendance Record</DialogTitle>
            <DialogDescription>
              Update the status of this flagged attendance record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <select
                id="status"
                className="w-full p-2 border rounded"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half-day">Half Day</option>
                <option value="outside-duty">Outside Duty</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutTime">Checkout Time (Optional)</Label>
              <Input
                id="checkOutTime"
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Leave blank to keep current checkout time. For auto-checked
                records, you can set the actual checkout time here.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approvalReason">Approval Reason (Optional)</Label>
              <Textarea
                id="approvalReason"
                placeholder="Enter reason for approval..."
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalDialog(false);
                setApprovalReason("");
                setCheckOutTime("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
